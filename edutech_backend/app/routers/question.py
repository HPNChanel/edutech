from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.models.quiz import Quiz
from app.schemas.question import Question as QuestionSchema, QuestionCreate, QuestionUpdate
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("/", response_model=QuestionSchema)
async def create_question(
    question: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if quiz exists and belongs to user
    result = await db.execute(
        select(Quiz).where(
            Quiz.id == question.quiz_id,
            Quiz.user_id == current_user.id
        )
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    db_question = Question(
        content=question.content,
        options=question.options,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        quiz_id=question.quiz_id
    )
    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)
    return db_question

@router.get("/quiz/{quiz_id}", response_model=List[QuestionSchema])
async def get_quiz_questions(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if quiz exists and belongs to user
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
    
    # Get questions for the quiz
    result = await db.execute(
        select(Question).where(Question.quiz_id == quiz_id)
    )
    return result.scalars().all()

@router.get("/{question_id}", response_model=QuestionSchema)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get question with quiz ownership check
    result = await db.execute(
        select(Question).join(Quiz).where(
            Question.id == question_id,
            Quiz.user_id == current_user.id
        )
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return question

@router.put("/{question_id}", response_model=QuestionSchema)
async def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get question with quiz ownership check
    result = await db.execute(
        select(Question).join(Quiz).where(
            Question.id == question_id,
            Quiz.user_id == current_user.id
        )
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    if question_update.content is not None:
        question.content = question_update.content
    if question_update.options is not None:
        question.options = question_update.options
    if question_update.correct_answer is not None:
        question.correct_answer = question_update.correct_answer
    if question_update.explanation is not None:
        question.explanation = question_update.explanation
    
    await db.commit()
    await db.refresh(question)
    return question

@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get question with quiz ownership check
    result = await db.execute(
        select(Question).join(Quiz).where(
            Question.id == question_id,
            Quiz.user_id == current_user.id
        )
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    await db.delete(question)
    await db.commit()
    return {"message": "Question deleted successfully"}