from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, date
from typing import List, Optional

from app.database import get_db
from app.models import Activity, ActivityLog, ActivityCustomField, ActivityLogFieldValue
from app.schemas.log import ActivityLogCreate, ActivityLogUpdate, ActivityLogOut

router = APIRouter(prefix="/logs", tags=["logs"])


def _load_log(db: Session, log_id: int):
    """Fetch a log with all relationships needed for ActivityLogOut."""
    return (
        db.query(ActivityLog)
        .options(
            joinedload(ActivityLog.activity),
            joinedload(ActivityLog.field_values).joinedload(ActivityLogFieldValue.field),
        )
        .filter(ActivityLog.id == log_id)
        .first()
    )


def _upsert_field_values(db: Session, log: ActivityLog, field_values_in, activity_id: int):
    """Replace field values for active fields; leave values for deleted fields untouched."""
    if field_values_in is None:
        return

    # Build a set of active field IDs for this activity
    active_field_ids = {
        r.id for r in db.query(ActivityCustomField.id).filter(
            ActivityCustomField.activity_id == activity_id,
            ActivityCustomField.deleted_at.is_(None),
        )
    }

    # Index incoming values by field_id (only for active fields)
    incoming = {
        fv.field_id: fv.value
        for fv in field_values_in
        if fv.field_id in active_field_ids
    }

    # Update or delete existing field values for active fields
    for existing in list(log.field_values):
        if existing.field_id not in active_field_ids:
            continue  # deleted field — leave untouched
        if existing.field_id in incoming:
            existing.value = incoming.pop(existing.field_id)
        else:
            db.delete(existing)

    # Insert new values
    for field_id, value in incoming.items():
        db.add(ActivityLogFieldValue(log_id=log.id, field_id=field_id, value=value))


@router.get("/", response_model=List[ActivityLogOut])
def list_logs(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ActivityLog)
        .options(
            joinedload(ActivityLog.activity),
            joinedload(ActivityLog.field_values).joinedload(ActivityLogFieldValue.field),
        )
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
    db.flush()  # get log.id before committing

    _upsert_field_values(db, log, payload.field_values, payload.activity_id)
    db.commit()

    return _load_log(db, log.id)


@router.get("/{log_id}", response_model=ActivityLogOut)
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = _load_log(db, log_id)
    if not log or log.deleted_at is not None:
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

    if payload.notes is not None:
        log.notes = payload.notes

    # Reload relationships so _upsert_field_values can see existing values
    db.flush()
    db.refresh(log, ["field_values"])
    _upsert_field_values(db, log, payload.field_values, log.activity_id)
    db.commit()

    return _load_log(db, log.id)


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
