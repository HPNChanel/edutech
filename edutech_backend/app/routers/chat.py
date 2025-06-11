from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_user
from app.schemas.chat import (
    ChatRequest, ChatResponse, Conversation, ConversationCreate, 
    ConversationUpdate, ConversationWithMessages, ConversationListResponse,
    Message, BulkDeleteRequest
)
from app.services.chat_service import chat_service
from app.services.openai_service import openai_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat"])

@router.post("/send", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Send a message to AI assistant and get response
    Creates new conversation if conversation_id is not provided
    """
    try:
        # Validate OpenAI API is configured
        if not openai_service.validate_api_key():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not properly configured. Please contact support."
            )
        
        # Process message and get AI response
        ai_message, conversation, tokens_used = await chat_service.send_message_and_get_response(
            db, current_user.id, chat_request
        )
        
        return ChatResponse(
            message=ai_message,
            conversation=conversation,
            tokens_used=tokens_used
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    include_archived: bool = Query(False, description="Include archived conversations"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user's chat conversations with pagination
    """
    try:
        conversations, total = await chat_service.get_user_conversations(
            db, current_user.id, page, per_page, include_archived
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=total,
            page=page,
            per_page=per_page
        )
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversations"
        )

@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    conversation_data: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new conversation
    """
    try:
        conversation = await chat_service.create_conversation(
            db, current_user.id, conversation_data
        )
        return conversation
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )

@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific conversation with all messages
    """
    try:
        conversation = await chat_service.get_conversation_with_messages(
            db, conversation_id, current_user.id
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation"
        )

@router.put("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: int,
    update_data: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update conversation details (title, archive status)
    """
    try:
        conversation = await chat_service.update_conversation(
            db, conversation_id, current_user.id, update_data
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update conversation"
        )

@router.delete("/conversations/bulk")
async def delete_selected_conversations(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete selected conversations and their messages for the current user
    """
    try:
        if not request.conversation_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No conversation IDs provided"
            )
        
        deleted_count, failed_count = await chat_service.delete_selected_conversations(
            db, request.conversation_ids, current_user.id
        )
        
        return {
            "message": f"Successfully deleted {deleted_count} conversations" + 
                      (f", {failed_count} failed" if failed_count > 0 else ""),
            "deleted_count": deleted_count,
            "failed_count": failed_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting selected conversations for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete selected conversations"
        )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a conversation and all its messages
    """
    try:
        success = await chat_service.delete_conversation(
            db, conversation_id, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )

@router.delete("/conversations/{conversation_id}/messages/{message_id}")
async def delete_message(
    conversation_id: int,
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific message from a conversation
    """
    try:
        success = await chat_service.delete_message(
            db, conversation_id, message_id, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or access denied"
            )
        
        return {"message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message {message_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete message"
        )

@router.delete("/conversations/{conversation_id}/messages")
async def delete_conversation_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete all messages from a conversation (clear chat history)
    """
    try:
        success = await chat_service.delete_conversation_messages(
            db, conversation_id, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return {"message": "Chat history cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing chat history for conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear chat history"
        )

@router.delete("/conversations")
async def delete_all_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete all conversations and messages for the current user
    """
    try:
        count = await chat_service.delete_all_user_conversations(
            db, current_user.id
        )
        
        return {
            "message": f"Successfully deleted {count} conversations",
            "deleted_count": count
        }
        
    except Exception as e:
        logger.error(f"Error deleting all conversations for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete all conversations"
        )

@router.get("/health")
async def health_check():
    """
    Check if AI chat service is healthy
    """
    try:
        api_configured = bool(openai_service.validate_api_key())
        
        return {
            "status": "healthy" if api_configured else "degraded",
            "openai_configured": api_configured,
            "message": "AI chat service is operational" if api_configured else "AI service needs configuration"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "openai_configured": False,
            "message": "AI chat service is unavailable"
        } 