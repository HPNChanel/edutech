from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
import logging

from app.models.document import Document
from app.models.lesson import Lesson
from app.models.category import Category
from app.services.document_parser import DocumentParserService
from app.schemas.document import DocumentConversionResult

logger = logging.getLogger(__name__)

class DocumentConversionService:
    
    @staticmethod
    async def get_or_create_default_category(db: AsyncSession, user_id: int) -> int:
        """Get or create default category for document conversions"""
        # Try to find existing "Imported Documents" category
        result = await db.execute(
            select(Category).where(
                Category.name == "Imported Documents",
                Category.user_id == user_id
            )
        )
        category = result.scalar_one_or_none()
        
        if not category:
            # Create default category
            category = Category(
                name="Imported Documents",
                description="Documents automatically converted to lessons",
                user_id=user_id
            )
            db.add(category)
            await db.commit()
            await db.refresh(category)
        
        return category.id
    
    @staticmethod
    async def convert_document_to_lesson(
        db: AsyncSession, 
        document_id: int, 
        user_id: int,
        category_id: Optional[int] = None,
        generate_summary: bool = True
    ) -> DocumentConversionResult:
        """
        Convert a document to a lesson
        
        Args:
            db: Database session
            document_id: ID of document to convert
            user_id: ID of user performing conversion
            category_id: Optional category ID for the lesson
            generate_summary: Whether to generate summary
            
        Returns:
            DocumentConversionResult with status and details
        """
        
        try:
            # Fetch the document
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            
            if not document:
                return DocumentConversionResult(
                    status="failed",
                    error="Document not found"
                )
            
            # Check if already converted
            if document.converted:
                return DocumentConversionResult(
                    status="failed",
                    error="Document has already been converted"
                )
            
            # Verify the original lesson belongs to the user
            result = await db.execute(
                select(Lesson).where(
                    Lesson.id == document.lesson_id,
                    Lesson.user_id == user_id
                )
            )
            original_lesson = result.scalar_one_or_none()
            
            if not original_lesson:
                return DocumentConversionResult(
                    status="failed",
                    error="Access denied or lesson not found"
                )
            
            # Parse the document
            try:
                title, content, summary = DocumentParserService.parse_document(
                    document.file_path, 
                    document.original_filename
                )
            except Exception as parse_error:
                error_msg = f"Failed to parse document: {str(parse_error)}"
                logger.error(error_msg)
                
                # Update document with error
                document.conversion_error = error_msg
                await db.commit()
                
                return DocumentConversionResult(
                    status="failed",
                    error=error_msg
                )
            
            # Get category ID
            if not category_id:
                category_id = await DocumentConversionService.get_or_create_default_category(
                    db, user_id
                )
            else:
                # Verify category belongs to user
                result = await db.execute(
                    select(Category).where(
                        Category.id == category_id,
                        Category.user_id == user_id
                    )
                )
                if not result.scalar_one_or_none():
                    category_id = await DocumentConversionService.get_or_create_default_category(
                        db, user_id
                    )
            
            # Create the new lesson
            new_lesson = Lesson(
                title=title,
                content=content,
                summary=summary if generate_summary else None,
                category_id=category_id,
                user_id=user_id
            )
            
            db.add(new_lesson)
            await db.commit()
            await db.refresh(new_lesson)
            
            # Update document conversion status
            document.converted = True
            document.converted_lesson_id = new_lesson.id
            document.conversion_error = None
            
            await db.commit()
            
            logger.info(f"Successfully converted document {document_id} to lesson {new_lesson.id}")
            
            return DocumentConversionResult(
                status="success",
                lesson_id=new_lesson.id
            )
            
        except Exception as e:
            await db.rollback()
            error_msg = f"Unexpected error during conversion: {str(e)}"
            logger.error(error_msg)
            
            # Try to update document with error if possible
            try:
                if 'document' in locals():
                    document.conversion_error = error_msg
                    await db.commit()
            except:
                pass
            
            return DocumentConversionResult(
                status="failed",
                error=error_msg
            )
