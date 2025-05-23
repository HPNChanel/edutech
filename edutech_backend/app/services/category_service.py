from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

class CategoryService:
    @staticmethod
    async def create_category(db: AsyncSession, user_id: int, category_data: CategoryCreate):
        """Create a new category for the user"""
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
            select(Category).where(Category.user_id == user_id)
        )
        return result.scalars().all()

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
    async def update_category(db: AsyncSession, category_id: int, user_id: int, category_data: CategoryUpdate):
        """Update a category, ensuring it belongs to the user"""
        category = await CategoryService.get_category_by_id(db, category_id, user_id)
        
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
        
        await db.delete(category)
        await db.commit()
        return {"message": "Category deleted successfully"}
