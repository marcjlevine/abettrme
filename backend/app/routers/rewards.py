from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models import Reward
from app.schemas.reward import RewardCreate, RewardUpdate, RewardOut

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("/", response_model=List[RewardOut])
def list_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).filter(Reward.deleted_at.is_(None)).order_by(Reward.points_required).all()


@router.post("/", response_model=RewardOut, status_code=201)
def create_reward(payload: RewardCreate, db: Session = Depends(get_db)):
    reward = Reward(**payload.model_dump())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@router.get("/{reward_id}", response_model=RewardOut)
def get_reward(reward_id: int, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.deleted_at.is_(None)
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    return reward


@router.put("/{reward_id}", response_model=RewardOut)
def update_reward(reward_id: int, payload: RewardUpdate, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.deleted_at.is_(None)
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reward, field, value)
    db.commit()
    db.refresh(reward)
    return reward


@router.delete("/{reward_id}", status_code=204)
def delete_reward(reward_id: int, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.deleted_at.is_(None)
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    reward.deleted_at = datetime.now(timezone.utc)
    db.commit()
