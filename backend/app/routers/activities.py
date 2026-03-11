from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models import Activity
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityOut

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/", response_model=List[ActivityOut])
def list_activities(db: Session = Depends(get_db)):
    return db.query(Activity).filter(Activity.deleted_at.is_(None)).order_by(Activity.name).all()


@router.post("/", response_model=ActivityOut, status_code=201)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    activity = Activity(**payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.deleted_at.is_(None)
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.put("/{activity_id}", response_model=ActivityOut)
def update_activity(activity_id: int, payload: ActivityUpdate, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.deleted_at.is_(None)
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.deleted_at.is_(None)
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity.deleted_at = datetime.now(timezone.utc)
    db.commit()
