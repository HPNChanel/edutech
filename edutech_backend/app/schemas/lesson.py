from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None

class LessonCreate(LessonBase):
    pass

class LessonUpdate(LessonBase):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None

class Lesson(LessonBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime