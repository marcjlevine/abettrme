from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.reward import RewardOut


class RedemptionCreate(BaseModel):
    notes: Optional[str] = None


class RedemptionOut(BaseModel):
    id: int
    reward_id: int
    points_snapshot: int
    notes: Optional[str] = None
    redeemed_at: datetime
    deleted_at: Optional[datetime] = None
    reward: Optional[RewardOut] = None

    model_config = {"from_attributes": True}


class ProgressOut(BaseModel):
    current_points: int
    all_time_points: int
