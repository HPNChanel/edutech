from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

class LearningGoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[date] = None

class LearningGoalCreate(LearningGoalBase):
    pass

class LearningGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    is_completed: Optional[bool] = None

class LearningGoalResponse(LearningGoalBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 