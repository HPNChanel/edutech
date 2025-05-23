from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class QuizBase(BaseModel):
    title: str
    lesson_id: int
    description: Optional[str] = None

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Quiz(QuizBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime