from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, distinct

from app.models.user import User
from app.models.lesson import Lesson
from app.models.note import Note
from app.models.category import Category

class DashboardService:
    @staticmethod
    async def get_notes_summary(db: AsyncSession, user_id: int, days: int = 7):
        """Get notes summary for the specified time period"""
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
    
    @staticmethod
    async def get_category_summary(db: AsyncSession, user_id: int):
        """Get notes distribution by category"""
        # Query categories with note counts
        query = (
            select(
                Category.id,
                Category.name,
                func.count(Note.id).label("note_count")
            )
            .outerjoin(Lesson, Lesson.category_id == Category.id)
            .outerjoin(Note, Note.lesson_id == Lesson.id)
            .where(Category.user_id == user_id)
            .group_by(Category.id, Category.name)
        )
        
        result = await db.execute(query)
        categories = [
            {
                "id": row.id, 
                "name": row.name, 
                "noteCount": row.note_count
            } 
            for row in result
        ]
        
        # Get uncategorized notes
        uncategorized_query = (
            select(func.count(Note.id))
            .join(Lesson, Note.lesson_id == Lesson.id)
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
    
    @staticmethod
    async def get_lessons_progress(db: AsyncSession, user_id: int):
        """Get progress of lessons by category"""
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
                "name": row.name,
                "totalLessons": row.lesson_count,
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
