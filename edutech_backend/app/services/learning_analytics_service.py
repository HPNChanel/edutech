from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, distinct, desc
from typing import Dict, List, Any
import logging

from app.models.user import User
from app.models.lesson import Lesson
from app.models.note import Note
from app.models.category import Category
from app.models.quiz import Quiz
from app.models.learning_goal import LearningGoal
from app.models.focus import FocusSession

logger = logging.getLogger(__name__)

class LearningAnalyticsService:
    @staticmethod
    async def get_user_learning_data(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """
        Gather comprehensive user learning data for AI personalization
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary containing user learning analytics
        """
        try:
            logger.info(f"Gathering learning data for user {user_id}")
            
            # Get user basic info
            user_query = select(User).where(User.id == user_id)
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()
            
            if not user:
                raise Exception(f"User {user_id} not found")
            
            # Gather all learning data in parallel
            stats = await LearningAnalyticsService._get_learning_stats(db, user_id)
            recent_lessons = await LearningAnalyticsService._get_recent_lessons(db, user_id)
            category_distribution = await LearningAnalyticsService._get_category_distribution(db, user_id)
            learning_goals = await LearningAnalyticsService._get_learning_goals(db, user_id)
            quiz_performance = await LearningAnalyticsService._get_quiz_performance(db, user_id)
            learning_streak = await LearningAnalyticsService._get_learning_streak(db, user_id)
            study_patterns = await LearningAnalyticsService._get_study_patterns(db, user_id)
            
            return {
                "name": user.name,
                "user_id": user_id,
                "stats": {
                    **stats,
                    "learning_streak": learning_streak
                },
                "recent_lessons": recent_lessons,
                "category_distribution": category_distribution,
                "learning_goals": learning_goals,
                "quiz_performance": quiz_performance,
                "study_patterns": study_patterns
            }
            
        except Exception as e:
            logger.error(f"Error gathering learning data for user {user_id}: {str(e)}")
            raise Exception(f"Failed to gather learning data: {str(e)}")

    @staticmethod
    async def _get_learning_stats(db: AsyncSession, user_id: int) -> Dict[str, int]:
        """Get basic learning statistics"""
        try:
            # Count queries
            lessons_query = select(func.count(Lesson.id)).where(Lesson.user_id == user_id)
            notes_query = select(func.count(Note.id)).where(Note.user_id == user_id)
            categories_query = select(func.count(Category.id)).where(Category.user_id == user_id)
            
            lessons_result = await db.execute(lessons_query)
            notes_result = await db.execute(notes_query)
            categories_result = await db.execute(categories_query)
            
            return {
                "total_lessons": lessons_result.scalar() or 0,
                "total_notes": notes_result.scalar() or 0,
                "total_categories": categories_result.scalar() or 0
            }
        except Exception as e:
            logger.error(f"Error getting learning stats: {e}")
            return {"total_lessons": 0, "total_notes": 0, "total_categories": 0}

    @staticmethod
    async def _get_recent_lessons(db: AsyncSession, user_id: int, limit: int = 10) -> List[str]:
        """Get recently studied lessons"""
        try:
            query = (
                select(Lesson.title)
                .where(Lesson.user_id == user_id)
                .order_by(desc(Lesson.updated_at))
                .limit(limit)
            )
            
            result = await db.execute(query)
            return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.error(f"Error getting recent lessons: {e}")
            return []

    @staticmethod
    async def _get_category_distribution(db: AsyncSession, user_id: int) -> List[Dict[str, Any]]:
        """Get category distribution with note counts"""
        try:
            query = (
                select(
                    Category.id,
                    Category.name,
                    func.count(Note.id).label("note_count")
                )
                .outerjoin(Lesson, Lesson.category_id == Category.id)
                .outerjoin(Note, and_(Note.lesson_id == Lesson.id, Note.user_id == user_id))
                .where(Category.user_id == user_id)
                .group_by(Category.id, Category.name)
                .order_by(desc(func.count(Note.id)))
            )
            
            result = await db.execute(query)
            return [
                {
                    "id": row.id,
                    "name": row.name,
                    "note_count": row.note_count or 0
                }
                for row in result.fetchall()
            ]
        except Exception as e:
            logger.error(f"Error getting category distribution: {e}")
            return []

    @staticmethod
    async def _get_learning_goals(db: AsyncSession, user_id: int) -> List[Dict[str, Any]]:
        """Get user learning goals"""
        try:
            query = (
                select(LearningGoal)
                .where(LearningGoal.user_id == user_id)
                .order_by(desc(LearningGoal.created_at))
                .limit(5)
            )
            
            result = await db.execute(query)
            goals = result.scalars().all()
            
            return [
                {
                    "id": goal.id,
                    "description": goal.description,
                    "is_active": goal.is_active,
                    "progress": goal.progress,
                    "target_date": goal.target_date.isoformat() if goal.target_date else None
                }
                for goal in goals
            ]
        except Exception as e:
            logger.error(f"Error getting learning goals: {e}")
            return []

    @staticmethod
    async def _get_quiz_performance(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """Get quiz performance statistics"""
        try:
            # Get recent quiz scores
            query = (
                select(Quiz.score, Quiz.total_questions)
                .where(Quiz.user_id == user_id)
                .order_by(desc(Quiz.created_at))
                .limit(10)
            )
            
            result = await db.execute(query)
            quizzes = result.fetchall()
            
            if not quizzes:
                return {"average_score": 0, "total_quizzes": 0, "recent_trend": "N/A"}
            
            # Calculate average score
            total_score = sum(q.score for q in quizzes)
            total_possible = sum(q.total_questions for q in quizzes)
            average_score = round((total_score / total_possible * 100) if total_possible > 0 else 0, 1)
            
            # Calculate trend (compare first half vs second half)
            mid_point = len(quizzes) // 2
            if mid_point > 0:
                recent_scores = [q.score / q.total_questions * 100 for q in quizzes[:mid_point]]
                older_scores = [q.score / q.total_questions * 100 for q in quizzes[mid_point:]]
                
                recent_avg = sum(recent_scores) / len(recent_scores)
                older_avg = sum(older_scores) / len(older_scores)
                
                if recent_avg > older_avg + 5:
                    trend = "Improving"
                elif recent_avg < older_avg - 5:
                    trend = "Declining"
                else:
                    trend = "Stable"
            else:
                trend = "Insufficient data"
            
            return {
                "average_score": average_score,
                "total_quizzes": len(quizzes),
                "recent_trend": trend
            }
        except Exception as e:
            logger.error(f"Error getting quiz performance: {e}")
            return {"average_score": 0, "total_quizzes": 0, "recent_trend": "N/A"}

    @staticmethod
    async def _get_learning_streak(db: AsyncSession, user_id: int) -> int:
        """Calculate current learning streak"""
        try:
            # Get all learning activity dates (notes, lessons)
            notes_query = (
                select(func.date(Note.created_at).label("activity_date"))
                .where(Note.user_id == user_id)
            )
            
            lessons_query = (
                select(func.date(Lesson.created_at).label("activity_date"))
                .where(Lesson.user_id == user_id)
            )
            
            # Union the queries to get all activity dates
            activity_query = notes_query.union(lessons_query).order_by(desc("activity_date"))
            
            result = await db.execute(activity_query)
            activity_dates = [row[0] for row in result.fetchall()]
            
            if not activity_dates:
                return 0
            
            # Calculate streak
            streak = 0
            current_date = datetime.now().date()
            
            for activity_date in activity_dates:
                if activity_date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                elif activity_date == current_date + timedelta(days=1):
                    current_date = activity_date
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
            
            return streak
        except Exception as e:
            logger.error(f"Error calculating learning streak: {e}")
            return 0

    @staticmethod
    async def _get_study_patterns(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """Analyze study patterns"""
        try:
            # Get activity by day of week
            query = (
                select(
                    func.extract('dow', Note.created_at).label("day_of_week"),
                    func.count().label("count")
                )
                .where(Note.user_id == user_id)
                .where(Note.created_at >= datetime.now() - timedelta(days=30))
                .group_by(func.extract('dow', Note.created_at))
            )
            
            result = await db.execute(query)
            day_patterns = {int(row.day_of_week): row.count for row in result.fetchall()}
            
            # Map day numbers to names
            day_names = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 
                        4: "Thursday", 5: "Friday", 6: "Saturday"}
            
            most_active_day = max(day_patterns, key=day_patterns.get) if day_patterns else 0
            
            return {
                "most_active_day": day_names.get(most_active_day, "Unknown"),
                "weekly_activity": {day_names[k]: v for k, v in day_patterns.items()},
                "total_recent_activity": sum(day_patterns.values())
            }
        except Exception as e:
            logger.error(f"Error analyzing study patterns: {e}")
            return {"most_active_day": "Unknown", "weekly_activity": {}, "total_recent_activity": 0} 