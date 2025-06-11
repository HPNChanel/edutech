from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Note content")
    text: Optional[str] = Field(None, max_length=5000, description="Selected text from lesson")
    start_offset: Optional[int] = Field(None, ge=0, description="Start position in lesson content")
    end_offset: Optional[int] = Field(None, ge=0, description="End position in lesson content")

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000, description="Note content")
    text: Optional[str] = Field(None, max_length=5000, description="Selected text from lesson")
    start_offset: Optional[int] = Field(None, ge=0, description="Start position in lesson content")
    end_offset: Optional[int] = Field(None, ge=0, description="End position in lesson content")

class Note(NoteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    lesson_id: int
    category_id: Optional[int] = None
    line_number: Optional[int] = None  # Legacy field
    from_char: Optional[int] = None    # Legacy field
    to_char: Optional[int] = None      # Legacy field
    selected_text: Optional[str] = None # Legacy field
    created_at: datetime
    updated_at: datetime

class NoteWithLesson(Note):
    """Note with lesson title included"""
    lesson_title: Optional[str] = Field(None, description="Title of the lesson this note belongs to")

class NoteWithRelations(Note):
    """Note with related user information"""
    user: Optional['UserBase'] = None

# Forward reference resolution
from app.schemas.user import UserBase
NoteWithRelations.model_rebuild()