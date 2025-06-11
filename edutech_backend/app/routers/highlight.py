from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.highlight import Highlight
from app.models.note import Note
from app.models.lesson import Lesson
from app.schemas.highlight import Highlight as HighlightSchema, HighlightCreate, HighlightUpdate, HighlightWithNoteCreate
from app.schemas.note import Note as NoteSchema, NoteCreate
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/highlights", tags=["highlights"])

@router.get("/", response_model=List[HighlightSchema])
async def get_highlights_by_lesson(
    lesson_id: int = Query(..., description="ID of the lesson to get highlights for"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all highlights for a specific lesson
    
    Args:
        lesson_id: ID of the lesson to retrieve highlights for
        
    Returns:
        List of highlights belonging to the current user for the specified lesson
        
    Raises:
        404: If lesson not found or doesn't belong to user
    """
    # Check if lesson exists and belongs to user
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
            detail="Lesson not found or access denied"
        )
    
    # Get highlights for the lesson
    result = await db.execute(
        select(Highlight).where(
            Highlight.lesson_id == lesson_id,
            Highlight.user_id == current_user.id
        ).order_by(Highlight.created_at)
    )
    return result.scalars().all()

@router.post("/", response_model=HighlightSchema)
async def create_highlight(
    highlight: HighlightCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if lesson exists
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == highlight.lesson_id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    db_highlight = Highlight(
        content=highlight.content,
        lesson_id=highlight.lesson_id,
        color=highlight.color,
        from_char=highlight.from_char,
        to_char=highlight.to_char,
        user_id=current_user.id
    )
    db.add(db_highlight)
    await db.commit()
    await db.refresh(db_highlight)
    return db_highlight

@router.post("/with-note", response_model=HighlightSchema)
async def create_highlight_with_note(
    highlight_with_note: HighlightWithNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if lesson exists
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == highlight_with_note.lesson_id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Create highlight
    db_highlight = Highlight(
        content=highlight_with_note.content,
        lesson_id=highlight_with_note.lesson_id,
        color=highlight_with_note.color,
        from_char=highlight_with_note.from_char,
        to_char=highlight_with_note.to_char,
        user_id=current_user.id
    )
    db.add(db_highlight)
    
    # Create note if note_content is provided
    if highlight_with_note.note_content:
        db_note = Note(
            content=highlight_with_note.note_content,
            lesson_id=highlight_with_note.lesson_id,
            from_char=highlight_with_note.from_char,
            to_char=highlight_with_note.to_char,
            selected_text=highlight_with_note.content,
            user_id=current_user.id
        )
        db.add(db_note)
    
    await db.commit()
    await db.refresh(db_highlight)
    return db_highlight

@router.get("/lesson/{lesson_id}", response_model=List[HighlightSchema])
async def get_lesson_highlights(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if lesson exists
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == lesson_id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get highlights for the lesson
    result = await db.execute(
        select(Highlight).where(
            Highlight.lesson_id == lesson_id,
            Highlight.user_id == current_user.id
        )
    )
    return result.scalars().all()

@router.get("/{highlight_id}", response_model=HighlightSchema)
async def get_highlight(
    highlight_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Highlight).where(
            Highlight.id == highlight_id,
            Highlight.user_id == current_user.id
        )
    )
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Highlight not found"
        )
    return highlight

@router.put("/{highlight_id}", response_model=HighlightSchema)
async def update_highlight(
    highlight_id: int,
    highlight_update: HighlightUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Highlight).where(
            Highlight.id == highlight_id,
            Highlight.user_id == current_user.id
        )
    )
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Highlight not found"
        )
    
    if highlight_update.content is not None:
        highlight.content = highlight_update.content
    if highlight_update.color is not None:
        highlight.color = highlight_update.color
    if highlight_update.from_char is not None:
        highlight.from_char = highlight_update.from_char
    if highlight_update.to_char is not None:
        highlight.to_char = highlight_update.to_char
    
    await db.commit()
    await db.refresh(highlight)
    return highlight

@router.delete("/{highlight_id}", status_code=status.HTTP_200_OK)
async def delete_highlight(
    highlight_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Highlight).where(
            Highlight.id == highlight_id,
            Highlight.user_id == current_user.id
        )
    )
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Highlight not found"
        )
    
    await db.delete(highlight)
    await db.commit()
    return {"message": "Highlight deleted successfully"}