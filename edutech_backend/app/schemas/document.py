from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class DocumentBase(BaseModel):
    original_filename: str
    file_type: str
    file_path: str

class DocumentCreate(DocumentBase):
    lesson_id: int

class DocumentConvert(BaseModel):
    category_id: Optional[int] = None
    generate_summary: bool = True

class Document(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    uploaded_at: datetime
    converted: bool = False
    converted_lesson_id: Optional[int] = None
    conversion_error: Optional[str] = None

class DocumentConversionResult(BaseModel):
    status: str  # "success" or "failed"
    lesson_id: Optional[int] = None
    error: Optional[str] = None