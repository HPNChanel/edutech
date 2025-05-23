from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DocumentBase(BaseModel):
    original_filename: str
    file_type: str
    file_path: str

class DocumentCreate(DocumentBase):
    lesson_id: int

class Document(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    uploaded_at: datetime