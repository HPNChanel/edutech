import os
import shutil
from pathlib import Path
from fastapi import UploadFile
import aiofiles
import magic
from app.config import settings

async def save_uploaded_file(upload_file: UploadFile, destination: str) -> None:
    """Save uploaded file to destination asynchronously"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        
        # Asynchronously save the file
        async with aiofiles.open(destination, 'wb') as out_file:
            content = await upload_file.read()
            await out_file.write(content)
    finally:
        await upload_file.close()

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return os.path.splitext(filename)[1].lower()

def is_allowed_file_type(filename: str) -> bool:
    """Check if file type is allowed"""
    allowed_extensions = [".txt", ".md", ".docx", ".pdf", ".html"]
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)

def generate_file_path(lesson_id: int, filename: str) -> str:
    """Generate file path for uploaded file"""
    upload_dir = settings.UPLOAD_DIR
    user_dir = os.path.join(upload_dir, f"lesson_{lesson_id}")
    
    # Create directory if it doesn't exist
    os.makedirs(user_dir, exist_ok=True)
    
    # Generate unique filename
    base_name = os.path.splitext(filename)[0]
    extension = os.path.splitext(filename)[1]
    file_path = os.path.join(user_dir, f"{base_name}{extension}")
    
    return file_path

def delete_file(file_path: str) -> None:
    """Delete a file"""
    if os.path.exists(file_path):
        os.remove(file_path)