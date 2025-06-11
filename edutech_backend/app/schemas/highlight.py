from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum

class HighlightColor(str, Enum):
    yellow = "yellow"
    red = "red"
    green = "green"

class HighlightBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Selected text to highlight")
    color: HighlightColor = Field(default=HighlightColor.yellow, description="Highlight color")
    start_offset: int = Field(..., ge=0, description="Start position in lesson content")
    end_offset: int = Field(..., ge=0, description="End position in lesson content")
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        # Ensure color string is not too long for database
        color_str = str(v.value) if hasattr(v, 'value') else str(v)
        if len(color_str) > 20:
            raise ValueError('Color value too long')
        return v
    
    @field_validator('end_offset')
    @classmethod 
    def validate_offsets(cls, v, info):
        if 'start_offset' in info.data and v <= info.data['start_offset']:
            raise ValueError('End offset must be greater than start offset')
        return v

class HighlightCreate(HighlightBase):
    pass

class HighlightUpdate(BaseModel):
    color: Optional[HighlightColor] = None

class Highlight(HighlightBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    lesson_id: int
    category_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class HighlightWithRelations(Highlight):
    """Highlight with related user information"""
    user: Optional['UserBase'] = None

# Forward reference resolution
from app.schemas.user import UserBase
HighlightWithRelations.model_rebuild()

# Export the enum for other modules
__all__ = ["HighlightColor", "HighlightBase", "HighlightCreate", "HighlightUpdate", "Highlight", "HighlightWithRelations"]

class HighlightWithNoteCreate(HighlightCreate):
    note_content: Optional[str] = None