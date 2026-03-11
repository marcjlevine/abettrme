from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    points: int


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None


class ActivityOut(ActivityBase):
    id: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
