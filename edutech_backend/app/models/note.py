from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    content = Column(Text, nullable=False)  # The note content
    text = Column(Text, nullable=True)  # Selected text from lesson (for text annotations)
    start_offset = Column(Integer, nullable=True)  # Start position in lesson content
    end_offset = Column(Integer, nullable=True)    # End position in lesson content
    line_number = Column(Integer, nullable=True)
    from_char = Column(Integer, nullable=True)  # Legacy field
    to_char = Column(Integer, nullable=True)    # Legacy field
    selected_text = Column(Text, nullable=True) # Legacy field
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notes")
    lesson = relationship("Lesson", back_populates="notes")
    category = relationship("Category", back_populates="notes")