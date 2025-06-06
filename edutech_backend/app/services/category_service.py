from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from fastapi import HTTPException, status

from app.models.category import Category
from app.models.lesson import Lesson
from app.models.note import Note
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryWithStats

class CategoryService:
    @staticmethod
    async def create_category(db: AsyncSession, user_id: int, category_data: CategoryCreate):
        """Create a new category for the user"""
        # Check if category name already exists for this user
        result = await db.execute(
            select(Category).where(
                and_(
                    Category.user_id == user_id,
                    Category.name == category_data.name
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        
        db_category = Category(
            name=category_data.name,
            description=category_data.description,
            user_id=user_id
        )
        db.add(db_category)
        await db.commit()
        await db.refresh(db_category)
        return db_category

    @staticmethod
    async def get_user_categories(db: AsyncSession, user_id: int):
        """Get all categories for a user"""
        result = await db.execute(
            select(Category).where(Category.user_id == user_id).order_by(Category.name)
        )
        return result.scalars().all()

    @staticmethod
    async def get_user_categories_with_stats(
        db: AsyncSession, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[CategoryWithStats]:
        """Get categories with lesson and note counts"""
        # Build base query
        query = select(
            Category.id,
            Category.name,
            Category.description,
            Category.user_id,
            Category.created_at,
            func.count(func.distinct(Lesson.id)).label('lesson_count'),
            func.count(func.distinct(Note.id)).label('note_count')
        ).outerjoin(
            Lesson, and_(Lesson.category_id == Category.id, Lesson.user_id == user_id)
        ).outerjoin(
            Note, and_(Note.lesson_id == Lesson.id, Note.user_id == user_id)
        ).where(
            Category.user_id == user_id
        ).group_by(
            Category.id, Category.name, Category.description, Category.user_id, Category.created_at
        )
        
        # Add search filter if provided
        if search:
            query = query.where(Category.name.ilike(f"%{search}%"))
        
        # Add pagination
        query = query.order_by(Category.name).offset(skip).limit(limit)
        
        result = await db.execute(query)
        categories = []
        
        for row in result:
            categories.append(CategoryWithStats(
                id=row.id,
                name=row.name,
                description=row.description,
                user_id=row.user_id,
                created_at=row.created_at,
                lesson_count=row.lesson_count or 0,
                note_count=row.note_count or 0
            ))
        
        return categories

    @staticmethod
    async def get_category_by_id(db: AsyncSession, category_id: int, user_id: int):
        """Get a category by ID, ensuring it belongs to the user"""
        result = await db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == user_id
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return category

    @staticmethod
    async def get_category_with_stats(db: AsyncSession, category_id: int, user_id: int) -> CategoryWithStats:
        """Get a category with statistics"""
        # Get the category first
        category = await CategoryService.get_category_by_id(db, category_id, user_id)
        
        # Get lesson count
        lesson_count_result = await db.execute(
            select(func.count(Lesson.id)).where(
                and_(
                    Lesson.category_id == category_id,
                    Lesson.user_id == user_id
                )
            )
        )
        lesson_count = lesson_count_result.scalar() or 0
        
        # Get note count
        note_count_result = await db.execute(
            select(func.count(Note.id)).where(
                and_(
                    Note.lesson_id == Lesson.id,
                    Lesson.category_id == category_id,
                    Note.user_id == user_id
                )
            )
        )
        note_count = note_count_result.scalar() or 0
        
        return CategoryWithStats(
            id=category.id,
            name=category.name,
            description=category.description,
            user_id=category.user_id,
            created_at=category.created_at,
            lesson_count=lesson_count,
            note_count=note_count
        )

    @staticmethod
    async def update_category(db: AsyncSession, category_id: int, user_id: int, category_data: CategoryUpdate):
        """Update a category, ensuring it belongs to the user"""
        category = await CategoryService.get_category_by_id(db, category_id, user_id)
        
        # Check if new name conflicts with existing categories
        if category_data.name and category_data.name != category.name:
            result = await db.execute(
                select(Category).where(
                    and_(
                        Category.user_id == user_id,
                        Category.name == category_data.name,
                        Category.id != category_id
                    )
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category with this name already exists"
                )
        
        if category_data.name is not None:
            category.name = category_data.name
        if category_data.description is not None:
            category.description = category_data.description
        
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def delete_category(db: AsyncSession, category_id: int, user_id: int):
        """Delete a category, ensuring it belongs to the user"""
        category = await CategoryService.get_category_by_id(db, category_id, user_id)
        
        # Check if category has lessons
        result = await db.execute(
            select(func.count(Lesson.id)).where(Lesson.category_id == category_id)
        )
        lesson_count = result.scalar() or 0
        
        if lesson_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category with {lesson_count} lessons. Move or delete lessons first."
            )
        
        await db.delete(category)
        await db.commit()
        return {"message": "Category deleted successfully"}
