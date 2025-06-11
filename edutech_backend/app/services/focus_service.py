from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.focus import FocusSession, FocusSettings
from app.schemas.focus import (
    FocusSessionCreate, 
    FocusSessionUpdate, 
    FocusSettingsCreate, 
    FocusSettingsUpdate,
    FocusStatsResponse
)

class FocusService:
    
    @staticmethod
    async def create_focus_session(
        db: AsyncSession, 
        user_id: int, 
        session_data: FocusSessionCreate
    ) -> FocusSession:
        """Create a new focus session"""
        db_session = FocusSession(
            user_id=user_id,
            duration_minutes=session_data.duration_minutes,
            session_type=session_data.session_type,
            notes=session_data.notes
        )
        db.add(db_session)
        await db.commit()
        await db.refresh(db_session)
        return db_session
    
    @staticmethod
    async def update_focus_session(
        db: AsyncSession,
        session_id: int,
        user_id: int,
        session_data: FocusSessionUpdate
    ) -> Optional[FocusSession]:
        """Update an existing focus session"""
        stmt = select(FocusSession).where(
            and_(
                FocusSession.id == session_id,
                FocusSession.user_id == user_id
            )
        )
        result = await db.execute(stmt)
        db_session = result.scalar_one_or_none()
        
        if not db_session:
            return None
            
        # Update fields if provided
        if session_data.actual_duration_minutes is not None:
            db_session.actual_duration_minutes = session_data.actual_duration_minutes
        if session_data.completed_at is not None:
            db_session.completed_at = session_data.completed_at
        if session_data.is_completed is not None:
            db_session.is_completed = session_data.is_completed
        if session_data.notes is not None:
            db_session.notes = session_data.notes
            
        await db.commit()
        await db.refresh(db_session)
        return db_session
    
    @staticmethod
    async def complete_focus_session(
        db: AsyncSession,
        session_id: int,
        user_id: int,
        actual_duration_minutes: int
    ) -> Optional[FocusSession]:
        """Mark a focus session as completed"""
        update_data = FocusSessionUpdate(
            actual_duration_minutes=actual_duration_minutes,
            completed_at=datetime.utcnow(),
            is_completed=True
        )
        return await FocusService.update_focus_session(db, session_id, user_id, update_data)
    
    @staticmethod
    async def get_focus_sessions(
        db: AsyncSession,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[FocusSession]:
        """Get user's focus sessions with pagination"""
        stmt = select(FocusSession).where(
            FocusSession.user_id == user_id
        ).order_by(desc(FocusSession.started_at)).limit(limit).offset(offset)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_focus_session(
        db: AsyncSession,
        session_id: int,
        user_id: int
    ) -> Optional[FocusSession]:
        """Get a specific focus session"""
        stmt = select(FocusSession).where(
            and_(
                FocusSession.id == session_id,
                FocusSession.user_id == user_id
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def delete_focus_session(
        db: AsyncSession,
        session_id: int,
        user_id: int
    ) -> bool:
        """Delete a focus session"""
        session = await FocusService.get_focus_session(db, session_id, user_id)
        if not session:
            return False
            
        await db.delete(session)
        await db.commit()
        return True
    
    # Focus Settings Methods
    @staticmethod
    async def get_or_create_focus_settings(
        db: AsyncSession,
        user_id: int
    ) -> FocusSettings:
        """Get user's focus settings or create default ones"""
        stmt = select(FocusSettings).where(FocusSettings.user_id == user_id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if not settings:
            settings = FocusSettings(user_id=user_id)
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
            
        return settings
    
    @staticmethod
    async def update_focus_settings(
        db: AsyncSession,
        user_id: int,
        settings_data: FocusSettingsUpdate
    ) -> FocusSettings:
        """Update user's focus settings"""
        settings = await FocusService.get_or_create_focus_settings(db, user_id)
        
        # Update fields if provided
        if settings_data.default_focus_duration is not None:
            settings.default_focus_duration = settings_data.default_focus_duration
        if settings_data.default_short_break is not None:
            settings.default_short_break = settings_data.default_short_break
        if settings_data.default_long_break is not None:
            settings.default_long_break = settings_data.default_long_break
        if settings_data.sessions_until_long_break is not None:
            settings.sessions_until_long_break = settings_data.sessions_until_long_break
        if settings_data.auto_start_breaks is not None:
            settings.auto_start_breaks = settings_data.auto_start_breaks
        if settings_data.auto_start_focus is not None:
            settings.auto_start_focus = settings_data.auto_start_focus
        if settings_data.sound_enabled is not None:
            settings.sound_enabled = settings_data.sound_enabled
            
        await db.commit()
        await db.refresh(settings)
        return settings
    
    # Statistics Methods
    @staticmethod
    async def get_focus_stats(
        db: AsyncSession,
        user_id: int
    ) -> FocusStatsResponse:
        """Get comprehensive focus statistics for a user"""
        # Get today's start and end
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # Get week start (Monday)
        week_start = today_start - timedelta(days=today.weekday())
        
        # Total sessions
        total_stmt = select(func.count(FocusSession.id)).where(
            FocusSession.user_id == user_id
        )
        total_result = await db.execute(total_stmt)
        total_sessions = total_result.scalar() or 0
        
        # Completed sessions and total focus time
        completed_stmt = select(
            func.count(FocusSession.id),
            func.coalesce(func.sum(FocusSession.actual_duration_minutes), 0)
        ).where(
            and_(
                FocusSession.user_id == user_id,
                FocusSession.is_completed == True,
                FocusSession.session_type == "focus"
            )
        )
        completed_result = await db.execute(completed_stmt)
        completed_data = completed_result.first()
        completed_sessions = completed_data[0] or 0
        total_focus_time = completed_data[1] or 0
        
        # Today's stats
        today_stmt = select(
            func.count(FocusSession.id),
            func.coalesce(func.sum(FocusSession.actual_duration_minutes), 0)
        ).where(
            and_(
                FocusSession.user_id == user_id,
                FocusSession.is_completed == True,
                FocusSession.session_type == "focus",
                FocusSession.started_at >= today_start,
                FocusSession.started_at <= today_end
            )
        )
        today_result = await db.execute(today_stmt)
        today_data = today_result.first()
        today_sessions = today_data[0] or 0
        today_focus_time = today_data[1] or 0
        
        # Weekly stats
        weekly_stmt = select(
            func.count(FocusSession.id),
            func.coalesce(func.sum(FocusSession.actual_duration_minutes), 0)
        ).where(
            and_(
                FocusSession.user_id == user_id,
                FocusSession.is_completed == True,
                FocusSession.session_type == "focus",
                FocusSession.started_at >= week_start
            )
        )
        weekly_result = await db.execute(weekly_stmt)
        weekly_data = weekly_result.first()
        weekly_sessions = weekly_data[0] or 0
        weekly_focus_time = weekly_data[1] or 0
        
        # Calculate current streak
        current_streak = await FocusService._calculate_current_streak(db, user_id)
        
        return FocusStatsResponse(
            total_sessions=total_sessions,
            total_focus_time=total_focus_time,
            completed_sessions=completed_sessions,
            current_streak=current_streak,
            today_sessions=today_sessions,
            today_focus_time=today_focus_time,
            weekly_sessions=weekly_sessions,
            weekly_focus_time=weekly_focus_time
        )
    
    @staticmethod
    async def _calculate_current_streak(db: AsyncSession, user_id: int) -> int:
        """Calculate the current daily streak of completed focus sessions"""
        current_date = datetime.utcnow().date()
        streak = 0
        
        for days_back in range(365):  # Check up to a year back
            check_date = current_date - timedelta(days=days_back)
            day_start = datetime.combine(check_date, datetime.min.time())
            day_end = datetime.combine(check_date, datetime.max.time())
            
            # Check if user had any completed focus sessions this day
            stmt = select(func.count(FocusSession.id)).where(
                and_(
                    FocusSession.user_id == user_id,
                    FocusSession.is_completed == True,
                    FocusSession.session_type == "focus",
                    FocusSession.started_at >= day_start,
                    FocusSession.started_at <= day_end
                )
            )
            result = await db.execute(stmt)
            daily_count = result.scalar() or 0
            
            if daily_count > 0:
                streak += 1
            else:
                break
                
        return streak 