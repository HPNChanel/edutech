from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    
    # Conversion tracking fields
    converted = Column(Boolean, default=False, nullable=False)
    converted_lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    conversion_error = Column(Text, nullable=True)
    
    # Relationships - Fix: Explicitly specify foreign_keys to resolve ambiguity
    lesson = relationship(
        "Lesson", 
        back_populates="documents", 
        foreign_keys=[lesson_id]
    )
    
    converted_lesson = relationship(
        "Lesson", 
        foreign_keys=[converted_lesson_id],
        overlaps="converted_documents"
    )