from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.chat import MessageRole

# Message schemas
class MessageBase(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=10000)

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime
    tokens_used: Optional[int] = 0
    
    class Config:
        from_attributes = True

# Conversation schemas
class ConversationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_archived: Optional[bool] = None

class Conversation(ConversationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_archived: bool = False
    
    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message] = []

# Chat request/response schemas
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[int] = None

class ChatResponse(BaseModel):
    message: Message
    conversation: Conversation
    tokens_used: int

# List responses
class ConversationListResponse(BaseModel):
    conversations: List[Conversation]
    total: int
    page: int = 1
    per_page: int = 20

# Bulk operations
class BulkDeleteRequest(BaseModel):
    conversation_ids: List[int] = Field(..., min_length=1, description="List of conversation IDs to delete") 