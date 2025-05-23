from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    content = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # Store as JSON array
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")