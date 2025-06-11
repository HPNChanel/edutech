from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # This will store the full_name
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, nullable=False)  # Track user active status
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Add property for compatibility
    @property
    def password_hash(self):
        return self.hashed_password
    
    @password_hash.setter
    def password_hash(self, value):
        self.hashed_password = value
    
    # Relationships
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    highlights = relationship("Highlight", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    focus_settings = relationship("FocusSettings", back_populates="user", cascade="all, delete-orphan")
    learning_goals = relationship("LearningGoal", back_populates="user", cascade="all, delete-orphan")