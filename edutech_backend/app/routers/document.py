from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.lesson import Lesson
from app.schemas.document import Document as DocumentSchema, DocumentCreate
from app.utils.auth import get_current_active_user
from app.utils.file_handler import save_uploaded_file, generate_file_path, is_allowed_file_type, get_file_extension

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload/{lesson_id}", response_model=DocumentSchema)
async def upload_document(
    lesson_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
            detail="Lesson not found"
        )
    
    # Validate file type
    if not is_allowed_file_type(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed. Supported: .txt, .md, .docx, .pdf"
        )
    
    # Generate file path and save file
    file_path = generate_file_path(lesson_id, file.filename)
    save_uploaded_file(file, file_path)
    
    # Create document record
    db_document = Document(
        lesson_id=lesson_id,
        original_filename=file.filename,
        file_type=get_file_extension(file.filename),
        file_path=file_path
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    return db_document

@router.get("/lesson/{lesson_id}", response_model=List[DocumentSchema])
async def get_lesson_documents(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
            detail="Lesson not found"
        )
    
    # Get documents for the lesson
    result = await db.execute(
        select(Document).where(Document.lesson_id == lesson_id)
    )
    return result.scalars().all()

@router.get("/{document_id}", response_model=DocumentSchema)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get document with lesson check
    result = await db.execute(
        select(Document).join(Lesson).where(
            Document.id == document_id,
            Lesson.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get document with lesson check
    result = await db.execute(
        select(Document).join(Lesson).where(
            Document.id == document_id,
            Lesson.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete file and database record
    from app.utils.file_handler import delete_file
    delete_file(document.file_path)
    
    await db.delete(document)
    await db.commit()
    return {"message": "Document deleted successfully"}