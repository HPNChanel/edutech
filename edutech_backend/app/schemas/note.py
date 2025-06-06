from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    content: str
    lesson_id: int
    line_number: Optional[int] = None
    from_char: Optional[int] = None
    to_char: Optional[int] = None
    selected_text: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    content: Optional[str] = None
    line_number: Optional[int] = None
    from_char: Optional[int] = None
    to_char: Optional[int] = None
    selected_text: Optional[str] = None

class Note(NoteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime