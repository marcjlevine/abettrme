from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from app.schemas.activity import ActivityOut
from app.schemas.field import FieldValueIn, FieldValueOut


class ActivityLogBase(BaseModel):
    activity_id: int
    date: date
    notes: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    field_values: Optional[List[FieldValueIn]] = None


class ActivityLogUpdate(BaseModel):
    activity_id: Optional[int] = None
    notes: Optional[str] = None
    field_values: Optional[List[FieldValueIn]] = None


class ActivityLogOut(BaseModel):
    id: int
    activity_id: int
    date: date
    notes: Optional[str] = None
    points_snapshot: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    activity: Optional[ActivityOut] = None
    field_values: List[FieldValueOut] = []

    model_config = {"from_attributes": True}
