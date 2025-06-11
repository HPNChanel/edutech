from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.utils.auth import get_current_active_user
from app.models.user import User
from app.schemas.learning_goal import LearningGoalCreate, LearningGoalUpdate, LearningGoalResponse
from app.services.learning_goal_service import LearningGoalService

router = APIRouter(prefix="/api/learning-goals", tags=["learning-goals"])

@router.post("", response_model=LearningGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: LearningGoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new learning goal"""
    return await LearningGoalService.create_goal(db, goal_data, current_user.id)

@router.get("", response_model=List[LearningGoalResponse])
async def get_goals(
    completed: bool = None,
    limit: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's learning goals with optional filters"""
    return await LearningGoalService.get_user_goals(db, current_user.id, limit, completed)

@router.get("/today", response_model=List[LearningGoalResponse])
async def get_today_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get today's active learning goals (max 3)"""
    return await LearningGoalService.get_today_goals(db, current_user.id)

@router.get("/{goal_id}", response_model=LearningGoalResponse)
async def get_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific learning goal"""
    goal = await LearningGoalService.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning goal not found"
        )
    return goal

@router.put("/{goal_id}", response_model=LearningGoalResponse)
async def update_goal(
    goal_id: int,
    goal_data: LearningGoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a learning goal"""
    goal = await LearningGoalService.update_goal(db, goal_id, current_user.id, goal_data)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning goal not found"
        )
    return goal

@router.put("/{goal_id}/complete", response_model=LearningGoalResponse)
async def complete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a learning goal as completed"""
    goal = await LearningGoalService.complete_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning goal not found"
        )
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a learning goal"""
    success = await LearningGoalService.delete_goal(db, goal_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning goal not found"
        )
    return None 