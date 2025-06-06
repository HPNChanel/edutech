from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.lesson import Lesson
from app.models.category import Category
from app.schemas.document import (
    Document as DocumentSchema, 
    DocumentCreate, 
    DocumentConvert,
    DocumentConversionResult
)
from app.utils.auth import get_current_active_user
from app.utils.file_handler import save_uploaded_file, generate_file_path, is_allowed_file_type, get_file_extension
from app.services.document_conversion import DocumentConversionService
from app.services.document_parser import DocumentParserService

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload")
async def upload_document_for_conversion(
    title: str = Form(...),
    file: UploadFile = File(...),
    category_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a document for conversion to lesson"""
    
    # Validate file type
    if not is_allowed_file_type(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed. Supported: .txt, .md, .docx, .pdf, .html"
        )
    
    # Check file size (10MB limit)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum size is 10MB."
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Validate category if provided
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
    
    try:
        # Create a temporary lesson for the document
        temp_lesson = Lesson(
            title=f"temp_{title}",
            content="",
            description=description,
            category_id=category_id,
            user_id=current_user.id
        )
        db.add(temp_lesson)
        await db.commit()
        await db.refresh(temp_lesson)
        
        # Generate file path and save file
        file_path = generate_file_path(temp_lesson.id, file.filename)
        await save_uploaded_file(file, file_path)
        
        # Try to parse the document immediately
        try:
            parsed_title, content, summary = DocumentParserService.parse_document(
                file_path, file.filename
            )
            
            # Create document record
            db_document = Document(
                lesson_id=temp_lesson.id,
                original_filename=file.filename,
                file_type=get_file_extension(file.filename),
                file_path=file_path
            )
            db.add(db_document)
            await db.commit()
            await db.refresh(db_document)
            
            # Return success response with parsed content
            return {
                "id": db_document.id,
                "status": "success",
                "title": title,
                "summary": summary,
                "converted_content": content,
                "lesson_id": temp_lesson.id
            }
            
        except Exception as parse_error:
            # If parsing fails, still create document record but mark as failed
            db_document = Document(
                lesson_id=temp_lesson.id,
                original_filename=file.filename,
                file_type=get_file_extension(file.filename),
                file_path=file_path,
                conversion_error=str(parse_error)
            )
            db.add(db_document)
            await db.commit()
            await db.refresh(db_document)
            
            return {
                "id": db_document.id,
                "status": "failed",
                "error_message": f"Failed to parse document: {str(parse_error)}"
            }
            
    except Exception as e:
        await db.rollback()
        # Clean up temp lesson if it was created
        if 'temp_lesson' in locals():
            try:
                await db.delete(temp_lesson)
                await db.commit()
            except:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/{document_id}/convert-to-lesson")
async def convert_document_to_lesson_endpoint(
    document_id: int,
    category_id: Optional[int] = None,
    generate_summary: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Convert a document to a lesson"""
    
    result = await DocumentConversionService.convert_document_to_lesson(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        category_id=category_id,
        generate_summary=generate_summary
    )
    
    if result.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error
        )
    
    return {
        "id": result.lesson_id,
        "status": result.status,
        "error_message": getattr(result, 'error', None)
    }

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

@router.post("/{document_id}/convert", response_model=DocumentConversionResult)
async def convert_document_to_lesson(
    document_id: int,
    conversion_data: DocumentConvert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Convert a document to a lesson"""
    
    result = await DocumentConversionService.convert_document_to_lesson(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        category_id=conversion_data.category_id,
        generate_summary=conversion_data.generate_summary
    )
    
    if result.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error
        )
    
    return result

@router.get("/{document_id}/conversion-status")
async def get_document_conversion_status(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get conversion status of a document"""
    
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
    
    return {
        "document_id": document.id,
        "converted": document.converted,
        "converted_lesson_id": document.converted_lesson_id,
        "conversion_error": document.conversion_error,
        "can_convert": not document.converted and not document.conversion_error
    }