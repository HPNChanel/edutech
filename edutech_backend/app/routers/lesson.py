from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
import os

from app.database import get_db
from app.models.user import User
from app.models.lesson import Lesson
from app.models.document import Document
from app.models.category import Category
from app.schemas.lesson import Lesson as LessonSchema, LessonCreate, LessonUpdate
from app.schemas.document import Document as DocumentSchema
from app.utils.auth import get_current_active_user
from app.utils.file_handler import save_uploaded_file, generate_file_path, is_allowed_file_type, get_file_extension
from app.config import settings

router = APIRouter(prefix="/lessons", tags=["lessons"])

@router.post("/", response_model=LessonSchema)
async def create_lesson(
    lesson: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # If category_id is provided, verify it exists
        if lesson.category_id:
            result = await db.execute(
                select(Category).where(
                    Category.id == lesson.category_id,
                    Category.user_id == current_user.id
                )
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category not found"
                )
        
        db_lesson = Lesson(
            title=lesson.title,
            content=lesson.content,
            summary=lesson.summary,
            category_id=lesson.category_id,
            user_id=current_user.id
        )
        db.add(db_lesson)
        await db.commit()
        await db.refresh(db_lesson)
        return db_lesson
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category_id or data constraint violation"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/", response_model=List[LessonSchema])
async def get_lessons(
    category_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Lesson).where(Lesson.user_id == current_user.id)
    if category_id:
        query = query.where(Lesson.category_id == category_id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/my-lessons", response_model=List[LessonSchema])
async def get_my_lessons(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: Optional[int] = Query(50, le=100),
    offset: Optional[int] = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all lessons for the current user with optional filtering
    """
    query = select(Lesson).options(joinedload(Lesson.category)).where(
        Lesson.user_id == current_user.id
    )
    
    # Apply filters
    if category_id:
        query = query.where(Lesson.category_id == category_id)
    
    if search:
        query = query.where(
            Lesson.title.contains(search) | 
            Lesson.content.contains(search) |
            Lesson.summary.contains(search)
        )
    
    # Add ordering and pagination
    query = query.order_by(Lesson.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{lesson_id}", response_model=LessonSchema)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if lesson exists and belongs to user
    result = await db.execute(
        select(Lesson).options(joinedload(Lesson.category)).where(
            Lesson.id == lesson_id,
            Lesson.user_id == current_user.id
        )
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    return lesson

@router.put("/{lesson_id}", response_model=LessonSchema)
async def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.user_id == current_user.id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    if lesson_update.title is not None:
        lesson.title = lesson_update.title
    if lesson_update.content is not None:
        lesson.content = lesson_update.content
    if lesson_update.summary is not None:
        lesson.summary = lesson_update.summary
    if lesson_update.category_id is not None:
        lesson.category_id = lesson_update.category_id
    
    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.user_id == current_user.id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    await db.delete(lesson)
    await db.commit()
    return {"message": "Lesson deleted successfully"}

@router.post("/{lesson_id}/generate-summary")
async def generate_lesson_summary(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.user_id == current_user.id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Placeholder for AI summary generation
    if lesson.content:
        # Simple summary logic - take first few sentences
        sentences = lesson.content.split('. ')
        summary = '. '.join(sentences[:3]) + '.' if len(sentences) > 3 else lesson.content
        lesson.summary = summary
        await db.commit()
        await db.refresh(lesson)
    
    return {"message": "Summary generated", "summary": lesson.summary}

@router.post("/upload", response_model=DocumentSchema)
async def upload_lesson_file(
    title: str,
    file: UploadFile = File(...),
    category_id: Optional[int] = None,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file and create a lesson from it"""
    
    # Validate file type
    if not is_allowed_file_type(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed. Supported: .txt, .md, .docx, .pdf"
        )
    
    # Check if category exists if provided
    if category_id:
        result = await db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == current_user.id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
    else:
        # Get or create default category
        result = await db.execute(
            select(Category).where(
                Category.name == "Uncategorized",
                Category.user_id == current_user.id
            )
        )
        default_category = result.scalar_one_or_none()
        
        if not default_category:
            # Create default category
            default_category = Category(
                name="Uncategorized",
                description="Default category for uploaded lessons",
                user_id=current_user.id
            )
            db.add(default_category)
            await db.commit()
            await db.refresh(default_category)
        
        category_id = default_category.id
    
    # Create a new lesson
    new_lesson = Lesson(
        title=title,
        description=description,
        category_id=category_id,
        user_id=current_user.id,
        content="" # Will be populated after file processing
    )
    db.add(new_lesson)
    await db.commit()
    await db.refresh(new_lesson)
    
    # Generate file path and save file
    file_path = generate_file_path(new_lesson.id, file.filename)
    await save_uploaded_file(file, file_path)
    
    # Create document record
    db_document = Document(
        lesson_id=new_lesson.id,
        original_filename=file.filename,
        file_type=get_file_extension(file.filename),
        file_path=file_path
    )
    db.add(db_document)
    
    # Update lesson content based on file type
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            new_lesson.content = content
    except Exception:
        # If we can't read the file directly, just note that in content
        new_lesson.content = f"Content from uploaded file: {file.filename}"
    
    await db.commit()
    await db.refresh(db_document)
    return db_document

@router.get("/search/", response_model=List[LessonSchema])
async def search_lessons(
    q: str = Query(..., min_length=1, description="Search query"),
    category_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search lessons by title or content"""
    
    query = select(Lesson).where(
        Lesson.user_id == current_user.id,
        Lesson.title.contains(q) | Lesson.content.contains(q)
    )
    
    if category_id:
        query = query.where(Lesson.category_id == category_id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{lesson_id}/stats")
async def get_lesson_stats(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get lesson statistics (notes, highlights, quizzes count)"""
    
    # Verify lesson belongs to user
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.user_id == current_user.id
        )
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get counts
    from app.models.note import Note
    from app.models.highlight import Highlight
    from app.models.quiz import Quiz
    
    notes_count = await db.execute(
        select(func.count(Note.id)).where(
            Note.lesson_id == lesson_id,
            Note.user_id == current_user.id
        )
    )
    
    highlights_count = await db.execute(
        select(func.count(Highlight.id)).where(
            Highlight.lesson_id == lesson_id,
            Highlight.user_id == current_user.id
        )
    )
    
    quizzes_count = await db.execute(
        select(func.count(Quiz.id)).where(
            Quiz.lesson_id == lesson_id,
            Quiz.user_id == current_user.id
        )
    )
    
    return {
        "lesson_id": lesson_id,
        "notes_count": notes_count.scalar(),
        "highlights_count": highlights_count.scalar(),
        "quizzes_count": quizzes_count.scalar(),
        "word_count": len(lesson.content.split()) if lesson.content else 0,
        "estimated_reading_time": max(1, len(lesson.content.split()) // 200) if lesson.content else 0  # 200 words per minute
    }