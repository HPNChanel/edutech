"""
EduTech Models Package
Import tất cả các models để SQLAlchemy có thể khởi tạo các bảng
"""

from .user import User
from .category import Category
from .lesson import Lesson
from .document import Document
from .note import Note
from .highlight import Highlight
from .quiz import Quiz
from .question import Question

__all__ = [
    "User",
    "Category", 
    "Lesson",
    "Document",
    "Note",
    "Highlight",
    "Quiz",
    "Question"
]