from typing import List, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import DataError, IntegrityError

from app.database import get_db
from app.models.user import User
from app.models.lesson import Lesson
from app.models.highlight import Highlight
from app.models.note import Note
from app.schemas.highlight import Highlight as HighlightSchema, HighlightCreate, HighlightUpdate
from app.schemas.note import Note as NoteSchema, NoteCreate, NoteUpdate
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/lessons", tags=["annotations"])

# Combined annotation response
class AnnotationResponse:
    def __init__(self, highlights: List[HighlightSchema], notes: List[NoteSchema]):
        self.highlights = highlights
        self.notes = notes

@router.get("/{lesson_id}/annotations")
async def get_lesson_annotations(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all highlights and notes for a lesson"""
    
    # Verify lesson exists and belongs to user
    lesson_result = await db.execute(
        select(Lesson).where(
            and_(Lesson.id == lesson_id, Lesson.user_id == current_user.id)
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get highlights
    highlights_result = await db.execute(
        select(Highlight).options(joinedload(Highlight.user)).where(
            and_(
                Highlight.lesson_id == lesson_id,
                Highlight.user_id == current_user.id
            )
        ).order_by(Highlight.start_offset)
    )
    highlights = highlights_result.scalars().all()
    
    # Get notes
    notes_result = await db.execute(
        select(Note).options(joinedload(Note.user)).where(
            and_(
                Note.lesson_id == lesson_id,
                Note.user_id == current_user.id,
                Note.start_offset.isnot(None)  # Only text-based notes
            )
        ).order_by(Note.start_offset)
    )
    notes = notes_result.scalars().all()
    
    return {
        "highlights": highlights,
        "notes": notes
    }

@router.post("/{lesson_id}/highlights", response_model=HighlightSchema)
async def create_highlight(
    lesson_id: int,
    highlight_data: HighlightCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new highlight for a lesson"""
    
    # Verify lesson exists and belongs to user
    lesson_result = await db.execute(
        select(Lesson).where(
            and_(Lesson.id == lesson_id, Lesson.user_id == current_user.id)
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Validate offsets
    if highlight_data.start_offset >= highlight_data.end_offset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start offset must be less than end offset"
        )
    
    # Check for overlapping highlights
    overlapping_result = await db.execute(
        select(Highlight).where(
            and_(
                Highlight.lesson_id == lesson_id,
                Highlight.user_id == current_user.id,
                Highlight.start_offset < highlight_data.end_offset,
                Highlight.end_offset > highlight_data.start_offset
            )
        )
    )
    overlapping = overlapping_result.scalar_one_or_none()
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create overlapping highlights"
        )
    
    # Create highlight
    try:
        db_highlight = Highlight(
            user_id=current_user.id,
            lesson_id=lesson_id,
            category_id=lesson.category_id,
            text=highlight_data.text,
            color=str(highlight_data.color.value),  # Convert enum to string value for database
            start_offset=highlight_data.start_offset,
            end_offset=highlight_data.end_offset
        )
        
        db.add(db_highlight)
        await db.commit()
        await db.refresh(db_highlight)
        
        return db_highlight
    except DataError as e:
        await db.rollback()
        # Handle specific database data errors
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if "Data too long for column 'color'" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Color field too long or invalid"
            )
        elif "text" in error_msg.lower() and "too long" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected text is too long"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid data provided"
            )
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data integrity error"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create highlight"
        )

@router.post("/{lesson_id}/notes", response_model=NoteSchema)
async def create_note(
    lesson_id: int,
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new note for a lesson"""
    
    # Verify lesson exists and belongs to user
    lesson_result = await db.execute(
        select(Lesson).where(
            and_(Lesson.id == lesson_id, Lesson.user_id == current_user.id)
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Validate offsets if provided
    if note_data.start_offset is not None and note_data.end_offset is not None:
        if note_data.start_offset >= note_data.end_offset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start offset must be less than end offset"
            )
    
    # Create note
    db_note = Note(
        user_id=current_user.id,
        lesson_id=lesson_id,
        category_id=lesson.category_id,
        content=note_data.content,
        text=note_data.text,
        start_offset=note_data.start_offset,
        end_offset=note_data.end_offset
    )
    
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    
    return db_note

@router.put("/{lesson_id}/highlights/{highlight_id}", response_model=HighlightSchema)
async def update_highlight(
    lesson_id: int,
    highlight_id: int,
    highlight_data: HighlightUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a highlight"""
    
    # Get highlight
    result = await db.execute(
        select(Highlight).where(
            and_(
                Highlight.id == highlight_id,
                Highlight.lesson_id == lesson_id,
                Highlight.user_id == current_user.id
            )
        )
    )
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Highlight not found"
        )
    
    # Update highlight
    if highlight_data.color is not None:
        highlight.color = str(highlight_data.color)  # Convert enum to string for database
    
    await db.commit()
    await db.refresh(highlight)
    
    return highlight

@router.delete("/{lesson_id}/highlights/{highlight_id}")
async def delete_highlight(
    lesson_id: int,
    highlight_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a highlight"""
    
    # Get highlight
    result = await db.execute(
        select(Highlight).where(
            and_(
                Highlight.id == highlight_id,
                Highlight.lesson_id == lesson_id,
                Highlight.user_id == current_user.id
            )
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

@router.delete("/{lesson_id}/notes/{note_id}")
async def delete_note(
    lesson_id: int,
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a note"""
    
    # Get note
    result = await db.execute(
        select(Note).where(
            and_(
                Note.id == note_id,
                Note.lesson_id == lesson_id,
                Note.user_id == current_user.id
            )
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    await db.delete(note)
    await db.commit()
    
    return {"message": "Note deleted successfully"} 