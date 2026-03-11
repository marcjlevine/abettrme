from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models import Reward, RewardRedemption
from app.schemas.redemption import RedemptionCreate, RedemptionOut

router = APIRouter(prefix="/redemptions", tags=["redemptions"])


@router.get("/", response_model=List[RedemptionOut])
def list_redemptions(db: Session = Depends(get_db)):
    return (
        db.query(RewardRedemption)
        .options(joinedload(RewardRedemption.reward))
        .filter(RewardRedemption.deleted_at.is_(None))
        .order_by(RewardRedemption.redeemed_at.desc())
        .all()
    )


@router.post("/{reward_id}/redeem", response_model=RedemptionOut, status_code=201)
def redeem_reward(reward_id: int, payload: RedemptionCreate, db: Session = Depends(get_db)):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.deleted_at.is_(None)
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    redemption = RewardRedemption(
        reward_id=reward.id,
        points_snapshot=reward.points_required,
        notes=payload.notes,
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    return (
        db.query(RewardRedemption)
        .options(joinedload(RewardRedemption.reward))
        .filter(RewardRedemption.id == redemption.id)
        .first()
    )


@router.delete("/{redemption_id}", status_code=204)
def undo_redemption(redemption_id: int, db: Session = Depends(get_db)):
    """Soft-delete a redemption, effectively undoing it and returning the points."""
    redemption = db.query(RewardRedemption).filter(
        RewardRedemption.id == redemption_id,
        RewardRedemption.deleted_at.is_(None)
    ).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    redemption.deleted_at = datetime.now(timezone.utc)
    db.commit()
