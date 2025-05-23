from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.models.lesson import Lesson
from app.schemas.note import Note as NoteSchema, NoteCreate, NoteUpdate
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post("/", response_model=NoteSchema)
async def create_note(
    note: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if lesson exists and belongs to user
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == note.lesson_id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    db_note = Note(
        content=note.content,
        lesson_id=note.lesson_id,
        line_number=note.line_number,
        from_char=note.from_char,
        to_char=note.to_char,
        selected_text=note.selected_text,
        user_id=current_user.id
    )
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[NoteSchema])
async def get_all_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note).where(
            Note.user_id == current_user.id
        )
    )
    return result.scalars().all()

@router.get("/lesson/{lesson_id}", response_model=List[NoteSchema])
async def get_lesson_notes(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
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
        
        # Get notes for the lesson
        result = await db.execute(
            select(Note).where(
                Note.lesson_id == lesson_id,
                Note.user_id == current_user.id
            )
        )
        return result.scalars().all()
    except SQLAlchemyError as e:
        # Log the error for debugging
        print(f"Database error in get_lesson_notes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching notes"
        )
    except Exception as e:
        # Log any other unexpected errors
        print(f"Unexpected error in get_lesson_notes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.get("/{note_id}", response_model=NoteSchema)
async def get_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return note

@router.put("/{note_id}", response_model=NoteSchema)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    if note_update.content is not None:
        note.content = note_update.content
    if note_update.line_number is not None:
        note.line_number = note_update.line_number
    if note_update.from_char is not None:
        note.from_char = note_update.from_char
    if note_update.to_char is not None:
        note.to_char = note_update.to_char
    if note_update.selected_text is not None:
        note.selected_text = note_update.selected_text
    
    await db.commit()
    await db.refresh(note)
    return note

@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == current_user.id
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