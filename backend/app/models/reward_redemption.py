from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    # Snapshot of points_required at the time of redemption.
    points_snapshot = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    reward = relationship("Reward", back_populates="redemptions")
