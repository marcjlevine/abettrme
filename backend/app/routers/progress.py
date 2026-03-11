from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import Optional, List

from app.database import get_db
from app.models import ActivityLog, RewardRedemption
from app.schemas.redemption import ProgressOut, RedemptionOut
from app.schemas.log import ActivityLogOut

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/summary", response_model=ProgressOut)
def get_summary(db: Session = Depends(get_db)):
    """
    all_time_points = sum of all non-deleted activity log point snapshots (+ and -)
    current_points  = all_time_points - sum of all non-deleted reward redemption point snapshots
    """
    all_time = db.query(func.coalesce(func.sum(ActivityLog.points_snapshot), 0)).filter(
        ActivityLog.deleted_at.is_(None)
    ).scalar()

    redeemed = db.query(func.coalesce(func.sum(RewardRedemption.points_snapshot), 0)).filter(
        RewardRedemption.deleted_at.is_(None)
    ).scalar()

    return ProgressOut(
        all_time_points=all_time,
        current_points=all_time - redeemed,
    )


@router.get("/logs", response_model=List[ActivityLogOut])
def get_logs_for_range(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Return activity log entries for a date range, newest first."""
    query = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.activity))
        .filter(ActivityLog.deleted_at.is_(None))
    )
    if start_date:
        query = query.filter(ActivityLog.date >= start_date)
    if end_date:
        query = query.filter(ActivityLog.date <= end_date)
    return query.order_by(ActivityLog.date.desc(), ActivityLog.created_at.desc()).all()


@router.get("/redemptions", response_model=List[RedemptionOut])
def get_redemptions_for_range(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Return reward redemptions for a date range."""
    query = (
        db.query(RewardRedemption)
        .options(joinedload(RewardRedemption.reward))
        .filter(RewardRedemption.deleted_at.is_(None))
    )
    if start_date:
        query = query.filter(func.date(RewardRedemption.redeemed_at) >= start_date)
    if end_date:
        query = query.filter(func.date(RewardRedemption.redeemed_at) <= end_date)
    return query.order_by(RewardRedemption.redeemed_at.desc()).all()
