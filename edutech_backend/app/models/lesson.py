from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="lessons")
    category = relationship("Category", back_populates="lessons")
    
    # Fix: Specify foreign_keys to resolve ambiguity
    documents = relationship(
        "Document", 
        back_populates="lesson", 
        foreign_keys="Document.lesson_id",
        cascade="all, delete-orphan"
    )
    
    # Separate relationship for converted documents
    converted_documents = relationship(
        "Document",
        foreign_keys="Document.converted_lesson_id",
        cascade="all, delete-orphan"
    )
    
    notes = relationship("Note", back_populates="lesson", cascade="all, delete-orphan")
    highlights = relationship("Highlight", back_populates="lesson", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")