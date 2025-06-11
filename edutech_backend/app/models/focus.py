from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duration_minutes = Column(Integer, nullable=False)  # Planned duration
    actual_duration_minutes = Column(Integer, nullable=True)  # Actual completed duration
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    session_type = Column(String(50), default="focus")  # focus, break, long_break
    notes = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="focus_sessions")

class FocusSettings(Base):
    __tablename__ = "focus_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    default_focus_duration = Column(Integer, default=25)  # minutes
    default_short_break = Column(Integer, default=5)  # minutes
    default_long_break = Column(Integer, default=15)  # minutes
    sessions_until_long_break = Column(Integer, default=4)
    auto_start_breaks = Column(Boolean, default=False)
    auto_start_focus = Column(Boolean, default=False)
    sound_enabled = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="focus_settings") 