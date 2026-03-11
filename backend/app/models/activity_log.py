from sqlalchemy import Column, Integer, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    # Snapshot of the activity's point value at the time of logging.
    # This preserves historical accuracy if the activity's points are later edited.
    points_snapshot = Column(Integer, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    activity = relationship("Activity", back_populates="logs")
