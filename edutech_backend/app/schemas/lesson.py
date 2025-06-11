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
    user: Optional['UserBase'] = None

class LessonWithStats(Lesson):
    """Extended lesson schema with additional statistics"""
    notes_count: Optional[int] = 0
    highlights_count: Optional[int] = 0
    quizzes_count: Optional[int] = 0
    word_count: Optional[int] = 0
    estimated_reading_time: Optional[int] = 0  # in minutes

class LessonSearchResult(BaseModel):
    """Schema for search results"""
    lessons: list[Lesson]
    total_count: int
    page: int
    page_size: int

class LessonWithCategory(Lesson):
    """Lesson schema with category information"""
    category: Optional['CategorySchema'] = None

class LessonSummary(BaseModel):
    """Simplified lesson summary for lists"""
    id: int
    title: str
    summary: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    content_length: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Forward reference resolution
from app.schemas.user import UserBase
from app.schemas.category import Category as CategorySchema
Lesson.model_rebuild()
LessonWithCategory.model_rebuild()