from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class RewardBase(BaseModel):
    name: str
    points_required: int
    notes: Optional[str] = None

    @field_validator("points_required")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("points_required must be a positive integer")
        return v


class RewardCreate(RewardBase):
    pass


class RewardUpdate(BaseModel):
    name: Optional[str] = None
    points_required: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("points_required")
    @classmethod
    def must_be_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("points_required must be a positive integer")
        return v


class RewardOut(RewardBase):
    id: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
