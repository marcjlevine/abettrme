from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, date
from typing import List, Optional

from app.database import get_db
from app.models import Activity, ActivityLog
from app.schemas.log import ActivityLogCreate, ActivityLogUpdate, ActivityLogOut

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/", response_model=List[ActivityLogOut])
def list_logs(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.activity))
        .filter(ActivityLog.deleted_at.is_(None))
    )
    if start_date:
        query = query.filter(ActivityLog.date >= start_date)
    if end_date:
        query = query.filter(ActivityLog.date <= end_date)
    return query.order_by(ActivityLog.date.desc(), ActivityLog.created_at.desc()).all()


@router.post("/", response_model=ActivityLogOut, status_code=201)
def create_log(payload: ActivityLogCreate, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(
        Activity.id == payload.activity_id,
        Activity.deleted_at.is_(None)
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    log = ActivityLog(
        activity_id=payload.activity_id,
        date=payload.date,
        notes=payload.notes,
        points_snapshot=activity.points,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    # Reload with relationship
    return db.query(ActivityLog).options(joinedload(ActivityLog.activity)).filter(ActivityLog.id == log.id).first()


@router.get("/{log_id}", response_model=ActivityLogOut)
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.activity))
        .filter(ActivityLog.id == log_id, ActivityLog.deleted_at.is_(None))
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return log


@router.put("/{log_id}", response_model=ActivityLogOut)
def update_log(log_id: int, payload: ActivityLogUpdate, db: Session = Depends(get_db)):
    log = db.query(ActivityLog).filter(
        ActivityLog.id == log_id,
        ActivityLog.deleted_at.is_(None)
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")

    # If activity is being changed, update the points snapshot too
    if payload.activity_id is not None and payload.activity_id != log.activity_id:
        activity = db.query(Activity).filter(
            Activity.id == payload.activity_id,
            Activity.deleted_at.is_(None)
        ).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        log.activity_id = payload.activity_id
        log.points_snapshot = activity.points

    if payload.date is not None:
        log.date = payload.date
    if payload.notes is not None:
        log.notes = payload.notes

    db.commit()
    db.refresh(log)
    return db.query(ActivityLog).options(joinedload(ActivityLog.activity)).filter(ActivityLog.id == log.id).first()


@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(ActivityLog).filter(
        ActivityLog.id == log_id,
        ActivityLog.deleted_at.is_(None)
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    log.deleted_at = datetime.now(timezone.utc)
    db.commit()
