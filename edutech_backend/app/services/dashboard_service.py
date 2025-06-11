from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, distinct
import logging

from app.models.user import User
from app.models.lesson import Lesson
from app.models.note import Note
from app.models.category import Category
from app.models.focus import FocusSession

logger = logging.getLogger(__name__)

class DashboardService:
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, user_id: int):
        """Get comprehensive dashboard statistics"""
        try:
            logger.info(f"Getting dashboard stats for user {user_id}")
            
            # Verify user exists
            user_query = select(User).where(User.id == user_id)
            result = await db.execute(user_query)
            user = result.scalar_one_or_none()
            
            if not user:
                logger.warning(f"User {user_id} not found")
                return {
                    "totalNotes": 0,
                    "totalLessons": 0,
                    "totalCategories": 0,
                    "recentActivity": []
                }
            
            # Get total counts
            notes_count_query = select(func.count(Note.id)).where(Note.user_id == user_id)
            lessons_count_query = select(func.count(Lesson.id)).where(Lesson.user_id == user_id)
            categories_count_query = select(func.count(Category.id)).where(Category.user_id == user_id)
            
            notes_result = await db.execute(notes_count_query)
            lessons_result = await db.execute(lessons_count_query)
            categories_result = await db.execute(categories_count_query)
            
            total_notes = notes_result.scalar() or 0
            total_lessons = lessons_result.scalar() or 0
            total_categories = categories_result.scalar() or 0
            
            # Get recent activity (last 5 notes)
            recent_notes_query = (
                select(Note.id, Note.content, Note.created_at, Lesson.title.label("lesson_title"))
                .join(Lesson, Note.lesson_id == Lesson.id, isouter=True)
                .where(Note.user_id == user_id)
                .order_by(Note.created_at.desc())
                .limit(5)
            )
            
            recent_notes_result = await db.execute(recent_notes_query)
            recent_activity = []
            
            for row in recent_notes_result:
                # Create a display title from content (first 50 characters)
                display_title = "Untitled Note"
                if row.content:
                    # Take first 50 chars and add ellipsis if longer
                    content_preview = row.content.strip()
                    if len(content_preview) > 50:
                        display_title = content_preview[:50] + "..."
                    else:
                        display_title = content_preview or "Untitled Note"
                
                recent_activity.append({
                    "id": row.id,
                    "title": display_title,
                    "lessonTitle": row.lesson_title or "Unknown Lesson",
                    "createdAt": row.created_at.isoformat() if row.created_at else None
                })

            return {
                "totalNotes": total_notes,
                "totalLessons": total_lessons,
                "totalCategories": total_categories,
                "recentActivity": recent_activity
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats for user {user_id}: {str(e)}")
            # Return fallback data instead of raising exception
            return {
                "totalNotes": 0,
                "totalLessons": 0,
                "totalCategories": 0,
                "recentActivity": []
            }

    @staticmethod
    async def get_notes_summary(db: AsyncSession, user_id: int, days: int = 7):
        """Get notes summary for the specified time period"""
        try:
            logger.info(f"Getting notes summary for user {user_id}, days: {days}")
            start_date = datetime.now() - timedelta(days=days)
            
            # Query to get notes count per day
            query = (
                select(
                    func.date(Note.created_at).label("date"),
                    func.count().label("count")
                )
                .where(
                    and_(
                        Note.user_id == user_id,
                        Note.created_at >= start_date
                    )
                )
                .group_by(func.date(Note.created_at))
                .order_by(func.date(Note.created_at))
            )
            
            result = await db.execute(query)
            data = [{"date": str(row.date), "count": row.count} for row in result]
            
            # Fill in missing dates with zero counts
            dates = {item["date"] for item in data}
            
            all_dates = []
            for i in range(days):
                date = (datetime.now() - timedelta(days=days-i-1)).strftime("%Y-%m-%d")
                all_dates.append(date)
            
            complete_data = []
            for date in all_dates:
                if date in dates:
                    complete_data.append(next(item for item in data if item["date"] == date))
                else:
                    complete_data.append({"date": date, "count": 0})
            
            return {
                "timeRange": f"Last {days} days",
                "data": complete_data
            }
            
        except Exception as e:
            logger.error(f"Error getting notes summary for user {user_id}: {str(e)}")
            raise Exception(f"Failed to retrieve notes summary: {str(e)}")
    
    @staticmethod
    async def get_category_summary(db: AsyncSession, user_id: int):
        """Get notes distribution by category"""
        try:
            logger.info(f"Getting category summary for user {user_id}")
            
            # Query categories with note counts
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
            )
            
            result = await db.execute(query)
            categories = [
                {
                    "id": row.id, 
                    "name": row.name or "Unnamed Category", 
                    "noteCount": row.note_count or 0
                } 
                for row in result
            ]
            
            # Get uncategorized notes
            uncategorized_query = (
                select(func.count(Note.id))
                .join(Lesson, Note.lesson_id == Lesson.id)
                .where(
                    and_(
                        Note.user_id == user_id,
                        Lesson.category_id.is_(None)
                    )
                )
            )
            
            result = await db.execute(uncategorized_query)
            uncategorized_count = result.scalar() or 0
            
            if uncategorized_count > 0:
                categories.append({
                    "id": None,
                    "name": "Uncategorized",
                    "noteCount": uncategorized_count
                })
            
            # Calculate percentages
            total_notes = sum(category["noteCount"] for category in categories)
            
            for category in categories:
                category["percentage"] = round((category["noteCount"] / total_notes * 100) if total_notes > 0 else 0, 1)
            
            return {
                "totalNotes": total_notes,
                "categories": categories
            }
            
        except Exception as e:
            logger.error(f"Error getting category summary for user {user_id}: {str(e)}")
            raise Exception(f"Failed to retrieve category summary: {str(e)}")
    
    @staticmethod
    async def get_lessons_progress(db: AsyncSession, user_id: int):
        """Get progress of lessons by category"""
        try:
            logger.info(f"Getting lessons progress for user {user_id}")
            
            # Get categories with lesson counts
            query = (
                select(
                    Category.id,
                    Category.name,
                    func.count(distinct(Lesson.id)).label("lesson_count")
                )
                .outerjoin(Lesson, and_(Lesson.category_id == Category.id, Lesson.user_id == user_id))
                .where(Category.user_id == user_id)
                .group_by(Category.id, Category.name)
            )
            
            result = await db.execute(query)
            categories = []
            
            for row in result:
                # For each category, get lessons with notes
                lessons_with_notes_query = (
                    select(func.count(distinct(Lesson.id)))
                    .join(Note, Note.lesson_id == Lesson.id)
                    .where(
                        and_(
                            Lesson.category_id == row.id,
                            Lesson.user_id == user_id
                        )
                    )
                )
                
                lessons_with_notes = await db.execute(lessons_with_notes_query)
                lessons_with_notes_count = lessons_with_notes.scalar() or 0
                
                categories.append({
                    "id": row.id,
                    "name": row.name or "Unnamed Category",
                    "totalLessons": row.lesson_count or 0,
                    "lessonsWithNotes": lessons_with_notes_count,
                    "progress": round((lessons_with_notes_count / row.lesson_count * 100) if row.lesson_count > 0 else 0, 1)
                })
            
            # Handle uncategorized lessons
            uncategorized_query = (
                select(func.count(distinct(Lesson.id)))
                .where(
                    and_(
                        Lesson.user_id == user_id,
                        Lesson.category_id.is_(None)
                    )
                )
            )
            
            result = await db.execute(uncategorized_query)
            uncategorized_count = result.scalar() or 0
            
            if uncategorized_count > 0:
                # Get uncategorized lessons with notes
                uncategorized_with_notes_query = (
                    select(func.count(distinct(Lesson.id)))
                    .join(Note, Note.lesson_id == Lesson.id)
                    .where(
                        and_(
                            Lesson.user_id == user_id,
                            Lesson.category_id.is_(None)
                        )
                    )
                )
                
                result = await db.execute(uncategorized_with_notes_query)
                uncategorized_with_notes_count = result.scalar() or 0
                
                categories.append({
                    "id": None,
                    "name": "Uncategorized",
                    "totalLessons": uncategorized_count,
                    "lessonsWithNotes": uncategorized_with_notes_count,
                    "progress": round((uncategorized_with_notes_count / uncategorized_count * 100) if uncategorized_count > 0 else 0, 1)
                })
            
            return {
                "categories": categories
            }
            
        except Exception as e:
            logger.error(f"Error getting lessons progress for user {user_id}: {str(e)}")
            raise Exception(f"Failed to retrieve lessons progress: {str(e)}")
    
    @staticmethod
    async def get_learning_streak(db: AsyncSession, user_id: int) -> int:
        """Calculate consecutive learning days based on focus sessions and note creation"""
        try:
            logger.info(f"Calculating learning streak for user {user_id}")
            
            # Get unique dates when user was active (created notes or completed focus sessions)
            activity_dates = set()
            
            # Get dates from focus sessions
            focus_query = (
                select(func.date(FocusSession.started_at))
                .where(FocusSession.user_id == user_id)
                .distinct()
            )
            focus_result = await db.execute(focus_query)
            for row in focus_result:
                activity_dates.add(row[0])
            
            # Get dates from note creation
            note_query = (
                select(func.date(Note.created_at))
                .where(Note.user_id == user_id)
                .distinct()
            )
            note_result = await db.execute(note_query)
            for row in note_result:
                activity_dates.add(row[0])
            
            if not activity_dates:
                return 0
            
            # Sort dates in descending order
            sorted_dates = sorted(activity_dates, reverse=True)
            today = date.today()
            streak = 0
            
            # Check if user was active today or yesterday (allow for timezone differences)
            if sorted_dates[0] >= today - timedelta(days=1):
                # Start counting streak
                expected_date = sorted_dates[0]
                for activity_date in sorted_dates:
                    if activity_date == expected_date:
                        streak += 1
                        expected_date -= timedelta(days=1)
                    else:
                        break
            
            return streak
            
        except Exception as e:
            logger.error(f"Error calculating learning streak for user {user_id}: {str(e)}")
            return 0
    
    @staticmethod
    async def get_monthly_learning_time(db: AsyncSession, user_id: int) -> dict:
        """Calculate total learning time for current month in minutes and format it"""
        try:
            logger.info(f"Calculating monthly learning time for user {user_id}")
            
            # Get start of current month
            today = date.today()
            start_of_month = date(today.year, today.month, 1)
            
            # Get completed focus sessions from this month
            query = (
                select(func.sum(FocusSession.actual_duration_minutes))
                .where(
                    and_(
                        FocusSession.user_id == user_id,
                        FocusSession.is_completed == True,
                        func.date(FocusSession.started_at) >= start_of_month
                    )
                )
            )
            
            result = await db.execute(query)
            total_minutes = result.scalar() or 0
            
            # Convert to hours and minutes
            hours = total_minutes // 60
            minutes = total_minutes % 60
            
            return {
                "total_minutes": total_minutes,
                "formatted_time": f"{hours}h {minutes:02d}min"
            }
            
        except Exception as e:
            logger.error(f"Error calculating monthly learning time for user {user_id}: {str(e)}")
            return {
                "total_minutes": 0,
                "formatted_time": "0h 00min"
            }
