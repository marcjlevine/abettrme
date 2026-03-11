from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.schemas.activity import ActivityOut


class ActivityLogBase(BaseModel):
    activity_id: int
    date: date
    notes: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogUpdate(BaseModel):
    activity_id: Optional[int] = None
    date: Optional[date] = None
    notes: Optional[str] = None


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

    model_config = {"from_attributes": True}
