from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HighlightBase(BaseModel):
    lesson_id: int
    content: str
    color: Optional[str] = "yellow"
    from_char: int
    to_char: int

class HighlightCreate(HighlightBase):
    pass

class HighlightUpdate(BaseModel):
    content: Optional[str] = None
    color: Optional[str] = None
    from_char: Optional[int] = None
    to_char: Optional[int] = None

class Highlight(HighlightBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class HighlightWithNoteCreate(HighlightCreate):
    note_content: Optional[str] = None