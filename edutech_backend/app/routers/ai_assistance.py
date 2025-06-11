from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import logging

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_user
from app.services.openai_service import openai_service
from app.services.learning_analytics_service import LearningAnalyticsService
from app.schemas import AIInlineRequest, AIInlineResponse, PersonalizedLearningRequest, PersonalizedLearningResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Assistance"])

@router.post("/inline-assistance", response_model=AIInlineResponse)
async def ai_inline_assistance(
    request: AIInlineRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Provide AI inline assistance for selected text in lessons
    
    Actions supported:
    - explanation: Explain the selected text
    - summary: Summarize the selected text  
    - translate_vi: Translate to Vietnamese
    - translate_en: Translate to English
    - ask_questions: Generate study questions
    """
    try:
        logger.info(f"AI inline assistance request from user {current_user.id}: action={request.action}")
        
        # Validate text length
        if len(request.text.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected text is too short. Please select at least 5 characters."
            )
        
        if len(request.text) > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected text is too long. Please select less than 1000 characters."
            )
        
        # Build user context for personalization
        user_context = {
            "name": current_user.name,
            "user_id": current_user.id
        }
        
        # Get AI assistance
        result, tokens_used = await openai_service.ai_inline_assistance(
            text=request.text,
            action=request.action,
            lesson_context=request.context,
            user_context=user_context
        )
        
        logger.info(f"AI inline assistance successful for user {current_user.id}, tokens: {tokens_used}")
        
        return AIInlineResponse(
            result=result,
            action=request.action,
            tokens_used=tokens_used
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI inline assistance for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI assistance. Please try again."
        )

@router.post("/personalized-learning", response_model=PersonalizedLearningResponse)
async def get_personalized_learning_suggestions(
    request: PersonalizedLearningRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get personalized learning suggestions based on user data
    
    Analyzes user's learning history, goals, performance, and patterns
    to provide tailored recommendations for:
    - Next lessons to study
    - Learning tips and strategies
    - Knowledge gaps to address
    - Progress summary
    """
    try:
        logger.info(f"Personalized learning request from user {current_user.id}")
        
        # Gather comprehensive user learning data
        user_learning_data = await LearningAnalyticsService.get_user_learning_data(db, current_user.id)
        
        # Generate AI suggestions
        suggestions, tokens_used = await openai_service.personalized_learning_suggestions(user_learning_data)
        
        logger.info(f"Personalized learning suggestions generated for user {current_user.id}, tokens: {tokens_used}")
        
        return PersonalizedLearningResponse(
            next_lesson_suggestion=suggestions.get("next_lesson_suggestion", ""),
            learning_tips=suggestions.get("learning_tips", ""),
            knowledge_gaps=suggestions.get("knowledge_gaps", ""),
            user_progress_summary=suggestions.get("user_progress_summary", ""),
            tokens_used=tokens_used
        )
        
    except Exception as e:
        logger.error(f"Error generating personalized learning suggestions for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate learning suggestions. Please try again."
        )

@router.get("/learning-data")
async def get_user_learning_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive user learning data for analytics and debugging
    """
    try:
        logger.info(f"Learning data request from user {current_user.id}")
        
        user_learning_data = await LearningAnalyticsService.get_user_learning_data(db, current_user.id)
        
        return {
            "status": "success",
            "data": user_learning_data
        }
        
    except Exception as e:
        logger.error(f"Error getting learning data for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve learning data. Please try again."
        ) 