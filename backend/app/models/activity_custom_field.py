import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum as SAEnum, func
from sqlalchemy.orm import relationship
from app.database import Base


class FieldType(str, enum.Enum):
    text = "text"
    duration = "duration"
    number = "number"
    select = "select"


class ActivityCustomField(Base):
    __tablename__ = "activity_custom_fields"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    name = Column(String(255), nullable=False)
    field_type = Column(SAEnum(FieldType, name="fieldtype"), nullable=False)
    options = Column(JSON, nullable=True)   # list of strings, for select type only
    unit = Column(String(50), nullable=True)  # display label, for number type only
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    activity = relationship("Activity", back_populates="fields")
    values = relationship("ActivityLogFieldValue", back_populates="field")
