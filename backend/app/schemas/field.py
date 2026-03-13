from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.activity_custom_field import FieldType


class FieldCreate(BaseModel):
    name: str
    field_type: FieldType
    options: Optional[List[str]] = None  # select type only
    unit: Optional[str] = None           # number type only


class FieldUpdate(BaseModel):
    name: Optional[str] = None
    options: Optional[List[str]] = None  # select type: merged with existing (add-only)
    unit: Optional[str] = None


class FieldOut(BaseModel):
    id: int
    activity_id: int
    name: str
    field_type: FieldType
    options: Optional[List[str]] = None
    unit: Optional[str] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FieldValueIn(BaseModel):
    field_id: int
    value: str


class FieldValueOut(BaseModel):
    id: int
    field_id: int
    value: str
    field: Optional[FieldOut] = None

    model_config = {"from_attributes": True}
