from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_user
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

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
        return await DashboardService.get_notes_summary(db, current_user.id, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notes summary: {str(e)}")

@router.get("/category-summary")
async def get_category_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get notes distribution by category
    """
    try:
        return await DashboardService.get_category_summary(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get category summary: {str(e)}")

@router.get("/lessons-progress")
async def get_lessons_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get lessons progress by category
    """
    try:
        return await DashboardService.get_lessons_progress(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get lessons progress: {str(e)}")
