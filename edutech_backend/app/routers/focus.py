from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.focus import (
    FocusSessionCreate,
    FocusSessionUpdate,
    FocusSessionResponse,
    FocusSettingsUpdate,
    FocusSettingsResponse,
    FocusStatsResponse,
    CompleteSessionRequest
)
from app.services.focus_service import FocusService
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/focus", tags=["focus"])

# Focus Sessions Endpoints
@router.post("/sessions", response_model=FocusSessionResponse)
async def create_focus_session(
    session_data: FocusSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new focus session"""
    try:
        session = await FocusService.create_focus_session(
            db=db,
            user_id=current_user.id,
            session_data=session_data
        )
        return session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create focus session: {str(e)}"
        )

@router.get("/sessions", response_model=List[FocusSessionResponse])
async def get_focus_sessions(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's focus sessions with pagination"""
    try:
        sessions = await FocusService.get_focus_sessions(
            db=db,
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get focus sessions: {str(e)}"
        )

@router.get("/sessions/{session_id}", response_model=FocusSessionResponse)
async def get_focus_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific focus session"""
    session = await FocusService.get_focus_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )
    
    return session

@router.put("/sessions/{session_id}", response_model=FocusSessionResponse)
async def update_focus_session(
    session_id: int,
    session_data: FocusSessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a focus session"""
    session = await FocusService.update_focus_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        session_data=session_data
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )
    
    return session

@router.post("/sessions/{session_id}/complete", response_model=FocusSessionResponse)
async def complete_focus_session(
    session_id: int,
    request: CompleteSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a focus session as completed"""
    session = await FocusService.complete_focus_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        actual_duration_minutes=request.actual_duration_minutes
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )
    
    return session

@router.delete("/sessions/{session_id}")
async def delete_focus_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a focus session"""
    success = await FocusService.delete_focus_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )
    
    return {"message": "Focus session deleted successfully"}

# Focus Settings Endpoints
@router.get("/settings", response_model=FocusSettingsResponse)
async def get_focus_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's focus settings"""
    try:
        settings = await FocusService.get_or_create_focus_settings(
            db=db,
            user_id=current_user.id
        )
        return settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get focus settings: {str(e)}"
        )

@router.put("/settings", response_model=FocusSettingsResponse)
async def update_focus_settings(
    settings_data: FocusSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's focus settings"""
    try:
        settings = await FocusService.update_focus_settings(
            db=db,
            user_id=current_user.id,
            settings_data=settings_data
        )
        return settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update focus settings: {str(e)}"
        )

# Statistics Endpoints
@router.get("/stats", response_model=FocusStatsResponse)
async def get_focus_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive focus statistics"""
    try:
        stats = await FocusService.get_focus_stats(
            db=db,
            user_id=current_user.id
        )
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get focus statistics: {str(e)}"
        ) 