from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, delete
from sqlalchemy.orm import selectinload

from app.models.chat import Conversation, Message, MessageRole
from app.models.user import User
from app.schemas.chat import ConversationCreate, ConversationUpdate, ChatRequest
from app.services.openai_service import openai_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChatService:
    
    async def create_conversation(
        self, 
        db: AsyncSession, 
        user_id: int, 
        conversation_data: ConversationCreate
    ) -> Conversation:
        """Create a new conversation for user"""
        try:
            conversation = Conversation(
                user_id=user_id,
                title=conversation_data.title or "New Conversation"
            )
            
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
            
            logger.info(f"Created conversation {conversation.id} for user {user_id}")
            return conversation
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create conversation: {e}")
            raise Exception("Failed to create conversation")

    async def get_user_conversations(
        self, 
        db: AsyncSession, 
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        include_archived: bool = False
    ) -> tuple[List[Conversation], int]:
        """Get user's conversations with pagination"""
        try:
            # Build query
            query = select(Conversation).where(Conversation.user_id == user_id)
            
            if not include_archived:
                query = query.where(Conversation.is_archived == False)
            
            # Count total
            count_query = select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
            if not include_archived:
                count_query = count_query.where(Conversation.is_archived == False)
            
            total_result = await db.execute(count_query)
            total = total_result.scalar()
            
            # Get paginated results
            query = query.order_by(desc(Conversation.updated_at))
            query = query.offset((page - 1) * per_page).limit(per_page)
            
            result = await db.execute(query)
            conversations = result.scalars().all()
            
            return list(conversations), total
            
        except Exception as e:
            logger.error(f"Failed to get conversations for user {user_id}: {e}")
            raise Exception("Failed to retrieve conversations")

    async def get_conversation_with_messages(
        self, 
        db: AsyncSession, 
        conversation_id: int, 
        user_id: int
    ) -> Optional[Conversation]:
        """Get conversation with all messages for user"""
        try:
            query = select(Conversation).options(
                selectinload(Conversation.messages)
            ).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            
            result = await db.execute(query)
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                return None
                
            return conversation
            
        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {e}")
            raise Exception("Failed to retrieve conversation")

    async def update_conversation(
        self, 
        db: AsyncSession, 
        conversation_id: int, 
        user_id: int,
        update_data: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update conversation details"""
        try:
            query = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            
            result = await db.execute(query)
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                return None
            
            # Update fields
            if update_data.title is not None:
                conversation.title = update_data.title
            if update_data.is_archived is not None:
                conversation.is_archived = update_data.is_archived
                
            conversation.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(conversation)
            
            logger.info(f"Updated conversation {conversation_id}")
            return conversation
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to update conversation {conversation_id}: {e}")
            raise Exception("Failed to update conversation")

    async def delete_conversation(
        self, 
        db: AsyncSession, 
        conversation_id: int, 
        user_id: int
    ) -> bool:
        """Delete conversation and all messages"""
        try:
            query = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            
            result = await db.execute(query)
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                return False
            
            await db.delete(conversation)
            await db.commit()
            
            logger.info(f"Deleted conversation {conversation_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to delete conversation {conversation_id}: {e}")
            raise Exception("Failed to delete conversation")

    async def send_message_and_get_response(
        self, 
        db: AsyncSession, 
        user_id: int,
        chat_request: ChatRequest
    ) -> tuple[Message, Conversation, int]:
        """Send user message and get AI response"""
        try:
            # Get or create conversation
            conversation = None
            existing_messages = []
            
            if chat_request.conversation_id:
                conversation = await self.get_conversation_with_messages(
                    db, chat_request.conversation_id, user_id
                )
                if not conversation:
                    raise Exception("Conversation not found")
                existing_messages = conversation.messages or []
            else:
                # Auto-generate conversation title from message
                title = self._generate_conversation_title(chat_request.message)
                conversation_data = ConversationCreate(title=title)
                conversation = await self.create_conversation(db, user_id, conversation_data)
                existing_messages = []  # New conversation has no messages
            
            # Save user message
            user_message = Message(
                conversation_id=conversation.id,
                role=MessageRole.USER,
                content=chat_request.message
            )
            db.add(user_message)
            await db.flush()  # Get ID without committing
            
            # Prepare conversation history for AI (without accessing conversation.messages)
            message_history = []
            for msg in existing_messages:
                message_history.append({
                    "role": msg.role.value,
                    "content": msg.content
                })
            
            # Add current user message
            message_history.append({
                "role": MessageRole.USER.value,
                "content": chat_request.message
            })
            
            # Get user context for personalization
            user_query = select(User).where(User.id == user_id)
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()
            
            user_context = {"name": user.name} if user else None
            
            # Generate AI response
            ai_content, tokens_used = await openai_service.generate_response(
                message_history, user_context
            )
            
            # Save AI response
            ai_message = Message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=ai_content,
                tokens_used=tokens_used
            )
            db.add(ai_message)
            
            # Update conversation timestamp
            conversation.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(user_message)
            await db.refresh(ai_message)
            await db.refresh(conversation)
            
            logger.info(f"Generated AI response for conversation {conversation.id}, tokens: {tokens_used}")
            return ai_message, conversation, tokens_used
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to process chat message: {e}")
            raise Exception(f"Failed to process message: {str(e)}")

    async def delete_message(
        self, 
        db: AsyncSession, 
        conversation_id: int, 
        message_id: int,
        user_id: int
    ) -> bool:
        """Delete a specific message from a conversation"""
        try:
            # First verify the conversation belongs to the user
            conversation_query = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation_result = await db.execute(conversation_query)
            conversation = conversation_result.scalar_one_or_none()
            
            if not conversation:
                return False
            
            # Find and delete the message
            message_query = select(Message).where(
                Message.id == message_id,
                Message.conversation_id == conversation_id
            )
            message_result = await db.execute(message_query)
            message = message_result.scalar_one_or_none()
            
            if not message:
                return False
            
            await db.delete(message)
            await db.commit()
            
            logger.info(f"Deleted message {message_id} from conversation {conversation_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to delete message {message_id}: {e}")
            raise Exception("Failed to delete message")

    async def delete_conversation_messages(
        self, 
        db: AsyncSession, 
        conversation_id: int, 
        user_id: int
    ) -> bool:
        """Delete all messages from a conversation (clear chat history)"""
        try:
            # First verify the conversation belongs to the user
            conversation_query = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation_result = await db.execute(conversation_query)
            conversation = conversation_result.scalar_one_or_none()
            
            if not conversation:
                return False
            
            # Delete all messages in the conversation
            delete_query = delete(Message).where(
                Message.conversation_id == conversation_id
            )
            await db.execute(delete_query)
            await db.commit()
            
            logger.info(f"Cleared all messages from conversation {conversation_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to clear messages from conversation {conversation_id}: {e}")
            raise Exception("Failed to clear chat history")

    async def delete_all_user_conversations(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> int:
        """Delete all conversations and messages for a user"""
        try:
            # Get count of conversations to be deleted
            count_query = select(func.count(Conversation.id)).where(
                Conversation.user_id == user_id
            )
            count_result = await db.execute(count_query)
            conversation_count = count_result.scalar() or 0
            
            # Delete all conversations for the user (cascade will delete messages)
            delete_query = delete(Conversation).where(
                Conversation.user_id == user_id
            )
            await db.execute(delete_query)
            await db.commit()
            
            logger.info(f"Deleted {conversation_count} conversations for user {user_id}")
            return conversation_count
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to delete all conversations for user {user_id}: {e}")
            raise Exception("Failed to delete all conversations")

    async def delete_selected_conversations(
        self, 
        db: AsyncSession, 
        conversation_ids: List[int], 
        user_id: int
    ) -> tuple[int, int]:
        """Delete selected conversations for a user. Returns (deleted_count, failed_count)"""
        try:
            deleted_count = 0
            failed_count = 0
            
            for conversation_id in conversation_ids:
                try:
                    # Verify the conversation belongs to the user
                    query = select(Conversation).where(
                        Conversation.id == conversation_id,
                        Conversation.user_id == user_id
                    )
                    
                    result = await db.execute(query)
                    conversation = result.scalar_one_or_none()
                    
                    if conversation:
                        await db.delete(conversation)
                        deleted_count += 1
                    else:
                        failed_count += 1
                        logger.warning(f"Conversation {conversation_id} not found or not owned by user {user_id}")
                        
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Failed to delete conversation {conversation_id}: {e}")
            
            await db.commit()
            
            logger.info(f"Bulk delete for user {user_id}: {deleted_count} successful, {failed_count} failed")
            return deleted_count, failed_count
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to delete selected conversations for user {user_id}: {e}")
            raise Exception("Failed to delete selected conversations")

    def _generate_conversation_title(self, first_message: str) -> str:
        """Generate conversation title from first message"""
        # Take first 50 chars and clean up
        title = first_message[:50].strip()
        if len(first_message) > 50:
            title += "..."
        
        # Remove line breaks and extra spaces
        title = " ".join(title.split())
        
        # Fallback
        if not title:
            title = "New Conversation"
            
        return title

# Create singleton instance
chat_service = ChatService() 