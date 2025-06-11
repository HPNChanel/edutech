from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Highlight(Base):
    __tablename__ = "highlights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    text = Column(Text, nullable=False)
    color = Column(String(20), nullable=False, default="yellow")  # yellow, red, green
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    ai_assistance = Column(Text, nullable=True)  # Store AI assistance results
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="highlights")
    lesson = relationship("Lesson", back_populates="highlights")
    category = relationship("Category", back_populates="highlights")