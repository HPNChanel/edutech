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
from .chat import Conversation, Message, MessageRole
from .focus import FocusSession, FocusSettings
from .learning_goal import LearningGoal

__all__ = [
    "User",
    "Category", 
    "Lesson",
    "Document",
    "Note",
    "Highlight",
    "Quiz",
    "Question",
    "Conversation",
    "Message",
    "MessageRole",
    "FocusSession",
    "FocusSettings",
    "LearningGoal"
]