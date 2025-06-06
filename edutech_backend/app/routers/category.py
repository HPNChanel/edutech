from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.lesson import Lesson
from app.schemas.category import Category as CategorySchema, CategoryCreate, CategoryUpdate, CategoryWithStats
from app.utils.auth import get_current_active_user
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new category"""
    try:
        return await CategoryService.create_category(db, current_user.id, category)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create category: {str(e)}"
        )

@router.get("/", response_model=List[CategoryWithStats])
async def get_categories(
    skip: int = Query(0, ge=0, description="Number of categories to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of categories to return"),
    search: Optional[str] = Query(None, description="Search categories by name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all categories for the current user with lesson counts"""
    try:
        return await CategoryService.get_user_categories_with_stats(
            db, current_user.id, skip=skip, limit=limit, search=search
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve categories: {str(e)}"
        )

@router.get("/{category_id}", response_model=CategoryWithStats)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific category by ID with stats"""
    return await CategoryService.get_category_with_stats(db, category_id, current_user.id)

@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a category"""
    return await CategoryService.update_category(db, category_id, current_user.id, category_update)

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a category"""
    return await CategoryService.delete_category(db, category_id, current_user.id)