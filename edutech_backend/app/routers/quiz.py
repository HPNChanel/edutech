from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz
from app.models.lesson import Lesson
from app.schemas.quiz import Quiz as QuizSchema, QuizCreate, QuizUpdate
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

@router.post("/", response_model=QuizSchema)
async def create_quiz(
    quiz: QuizCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if lesson exists and belongs to user
    result = await db.execute(
        select(Lesson).where(
            Lesson.id == quiz.lesson_id,
            Lesson.user_id == current_user.id
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    db_quiz = Quiz(
        title=quiz.title,
        description=quiz.description,
        lesson_id=quiz.lesson_id,
        user_id=current_user.id
    )
    db.add(db_quiz)
    await db.commit()
    await db.refresh(db_quiz)
    return db_quiz

@router.get("/", response_model=List[QuizSchema])
async def get_user_quizzes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Quiz).where(Quiz.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/lesson/{lesson_id}", response_model=List[QuizSchema])
async def get_lesson_quizzes(
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
    
    # Get quizzes for the lesson
    result = await db.execute(
        select(Quiz).where(
            Quiz.lesson_id == lesson_id,
            Quiz.user_id == current_user.id
        )
    )
    return result.scalars().all()

@router.get("/{quiz_id}", response_model=QuizSchema)
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Quiz).where(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id
        )
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    return quiz

@router.put("/{quiz_id}", response_model=QuizSchema)
async def update_quiz(
    quiz_id: int,
    quiz_update: QuizUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Quiz).where(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id
        )
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    if quiz_update.title is not None:
        quiz.title = quiz_update.title
    if quiz_update.description is not None:
        quiz.description = quiz_update.description
    
    await db.commit()
    await db.refresh(quiz)
    return quiz

@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Quiz).where(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id
        )
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    await db.delete(quiz)
    await db.commit()
    return {"message": "Quiz deleted successfully"}