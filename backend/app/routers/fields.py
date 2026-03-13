from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models import Activity, ActivityCustomField
from app.schemas.field import FieldCreate, FieldUpdate, FieldOut

router = APIRouter(prefix="/activities/{activity_id}/fields", tags=["fields"])


def _get_activity_or_404(activity_id: int, db: Session) -> Activity:
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.deleted_at.is_(None),
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.get("/", response_model=List[FieldOut])
def list_fields(activity_id: int, db: Session = Depends(get_db)):
    _get_activity_or_404(activity_id, db)
    return (
        db.query(ActivityCustomField)
        .filter(
            ActivityCustomField.activity_id == activity_id,
            ActivityCustomField.deleted_at.is_(None),
        )
        .order_by(ActivityCustomField.created_at)
        .all()
    )


@router.post("/", response_model=FieldOut, status_code=201)
def create_field(activity_id: int, payload: FieldCreate, db: Session = Depends(get_db)):
    _get_activity_or_404(activity_id, db)
    field = ActivityCustomField(activity_id=activity_id, **payload.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.put("/{field_id}", response_model=FieldOut)
def update_field(activity_id: int, field_id: int, payload: FieldUpdate, db: Session = Depends(get_db)):
    _get_activity_or_404(activity_id, db)
    field = db.query(ActivityCustomField).filter(
        ActivityCustomField.id == field_id,
        ActivityCustomField.activity_id == activity_id,
        ActivityCustomField.deleted_at.is_(None),
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    data = payload.model_dump(exclude_unset=True)

    # For select fields: merge new options with existing (add-only, no removal)
    if "options" in data:
        existing = field.options or []
        merged = list(existing)
        for opt in data["options"]:
            if opt not in merged:
                merged.append(opt)
        field.options = merged
        del data["options"]

    for key, val in data.items():
        setattr(field, key, val)

    db.commit()
    db.refresh(field)
    return field


@router.delete("/{field_id}", status_code=204)
def delete_field(activity_id: int, field_id: int, db: Session = Depends(get_db)):
    _get_activity_or_404(activity_id, db)
    field = db.query(ActivityCustomField).filter(
        ActivityCustomField.id == field_id,
        ActivityCustomField.activity_id == activity_id,
        ActivityCustomField.deleted_at.is_(None),
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    field.deleted_at = datetime.now(timezone.utc)
    db.commit()
