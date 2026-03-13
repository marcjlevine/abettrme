from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class ActivityLogFieldValue(Base):
    __tablename__ = "activity_log_field_values"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("activity_log.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("activity_custom_fields.id"), nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    log = relationship("ActivityLog", back_populates="field_values")
    field = relationship("ActivityCustomField", back_populates="values")
