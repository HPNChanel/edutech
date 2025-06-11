from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.models.learning_goal import LearningGoal
from app.schemas.learning_goal import LearningGoalCreate, LearningGoalUpdate

class LearningGoalService:
    
    @staticmethod
    async def create_goal(db: AsyncSession, goal_data: LearningGoalCreate, user_id: int) -> LearningGoal:
        """Create a new learning goal"""
        db_goal = LearningGoal(
            user_id=user_id,
            title=goal_data.title,
            description=goal_data.description,
            target_date=goal_data.target_date
        )
        db.add(db_goal)
        await db.commit()
        await db.refresh(db_goal)
        return db_goal
    
    @staticmethod
    async def get_user_goals(db: AsyncSession, user_id: int, limit: Optional[int] = None, completed: Optional[bool] = None) -> List[LearningGoal]:
        """Get user's learning goals with optional filters"""
        query = select(LearningGoal).where(LearningGoal.user_id == user_id)
        
        if completed is not None:
            query = query.where(LearningGoal.is_completed == completed)
            
        query = query.order_by(desc(LearningGoal.created_at))
        
        if limit:
            query = query.limit(limit)
            
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_today_goals(db: AsyncSession, user_id: int, limit: int = 3) -> List[LearningGoal]:
        """Get today's active learning goals (max 3)"""
        today = date.today()
        query = select(LearningGoal).where(
            and_(
                LearningGoal.user_id == user_id,
                LearningGoal.is_completed == False,
                LearningGoal.target_date >= today
            )
        ).order_by(LearningGoal.target_date).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_goal_by_id(db: AsyncSession, goal_id: int, user_id: int) -> Optional[LearningGoal]:
        """Get a specific goal by ID for the user"""
        query = select(LearningGoal).where(
            and_(
                LearningGoal.id == goal_id,
                LearningGoal.user_id == user_id
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_goal(db: AsyncSession, goal_id: int, user_id: int, goal_data: LearningGoalUpdate) -> Optional[LearningGoal]:
        """Update a learning goal"""
        db_goal = await LearningGoalService.get_goal_by_id(db, goal_id, user_id)
        if not db_goal:
            return None
            
        update_data = goal_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_goal, field, value)
        
        db_goal.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_goal)
        return db_goal
    
    @staticmethod
    async def delete_goal(db: AsyncSession, goal_id: int, user_id: int) -> bool:
        """Delete a learning goal"""
        db_goal = await LearningGoalService.get_goal_by_id(db, goal_id, user_id)
        if not db_goal:
            return False
            
        await db.delete(db_goal)
        await db.commit()
        return True
    
    @staticmethod
    async def complete_goal(db: AsyncSession, goal_id: int, user_id: int) -> Optional[LearningGoal]:
        """Mark a goal as completed"""
        db_goal = await LearningGoalService.get_goal_by_id(db, goal_id, user_id)
        if not db_goal:
            return None
            
        db_goal.is_completed = True
        db_goal.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_goal)
        return db_goal 