from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.field import FieldOut


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
    fields: List["FieldOut"] = []

    model_config = {"from_attributes": True}


# Resolve forward reference
from app.schemas.field import FieldOut  # noqa: E402
ActivityOut.model_rebuild()
