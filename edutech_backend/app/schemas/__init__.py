# Import schema classes here

# Create schema for AI inline assistance request
from pydantic import BaseModel
from typing import Optional, Literal

class AIInlineRequest(BaseModel):
    text: str
    action: Literal["explanation", "summary", "translate_vi", "translate_en", "ask_questions"]
    lesson_id: int
    context: Optional[str] = None

class AIInlineResponse(BaseModel):
    result: str
    action: str
    tokens_used: int

class PersonalizedLearningRequest(BaseModel):
    pass  # No additional parameters needed, will use user context

class PersonalizedLearningResponse(BaseModel):
    next_lesson_suggestion: str
    learning_tips: str
    knowledge_gaps: str
    user_progress_summary: str
    tokens_used: int
