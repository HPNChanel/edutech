from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Any

class QuestionBase(BaseModel):
    content: str
    options: List[Any]  # JSON array of options
    correct_answer: str
    explanation: Optional[str] = None

class QuestionCreate(QuestionBase):
    quiz_id: int

class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    options: Optional[List[Any]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None

class Question(QuestionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    quiz_id: int
    created_at: datetime