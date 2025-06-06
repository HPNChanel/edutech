from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_user
from app.services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive dashboard statistics and overview
    """
    try:
        logger.info(f"Dashboard stats requested for user {current_user.id}")
        result = await DashboardService.get_dashboard_stats(db, current_user.id)
        return result
    except AttributeError as e:
        logger.error(f"Model attribute error for user {current_user.id}: {str(e)}")
        # Return fallback data for attribute errors
        return {
            "totalNotes": 0,
            "totalLessons": 0,
            "totalCategories": 0,
            "recentActivity": []
        }
    except Exception as e:
        logger.error(f"Dashboard error for user {current_user.id}: {str(e)}")
        # Return fallback data instead of raising HTTPException
        return {
            "totalNotes": 0,
            "totalLessons": 0,
            "totalCategories": 0,
            "recentActivity": []
        }

@router.get("/notes-summary")
async def get_notes_summary(
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get notes summary for a time period
    
    - **days**: Number of days to include in the summary (1-30)
    """
    try:
        logger.info(f"Notes summary requested for user {current_user.id}, days: {days}")
        return await DashboardService.get_notes_summary(db, current_user.id, days)
    except AttributeError as e:
        logger.error(f"Model attribute error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard configuration error")
    except Exception as e:
        logger.error(f"Notes summary error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard error")

@router.get("/category-summary")
async def get_category_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get notes distribution by category
    """
    try:
        logger.info(f"Category summary requested for user {current_user.id}")
        return await DashboardService.get_category_summary(db, current_user.id)
    except AttributeError as e:
        logger.error(f"Model attribute error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard configuration error")
    except Exception as e:
        logger.error(f"Category summary error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard error")

@router.get("/lessons-progress")
async def get_lessons_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get lessons progress by category
    """
    try:
        logger.info(f"Lessons progress requested for user {current_user.id}")
        return await DashboardService.get_lessons_progress(db, current_user.id)
    except AttributeError as e:
        logger.error(f"Model attribute error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard configuration error")
    except Exception as e:
        logger.error(f"Lessons progress error for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dashboard error")
