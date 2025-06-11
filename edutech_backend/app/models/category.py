from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="categories")
    lessons = relationship("Lesson", back_populates="category", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="category", cascade="all, delete-orphan")
    highlights = relationship("Highlight", back_populates="category", cascade="all, delete-orphan")