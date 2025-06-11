from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
# Import routers
from app.routers import auth, user, lesson, category, note, highlight, dashboard, quiz, question, document, annotation, chat, focus, learning_goals, ai_assistance

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()
    yield

app = FastAPI(
    title="EduTech API",
    description="Personalized Learning Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://127.0.0.1:5173",  # Alternative localhost format
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(lesson.router, prefix="/api")
app.include_router(category.router, prefix="/api")
app.include_router(note.router, prefix="/api")
app.include_router(highlight.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(question.router, prefix="/api")
app.include_router(document.router, prefix="/api")
app.include_router(annotation.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(focus.router, prefix="/api")
app.include_router(learning_goals.router)
app.include_router(dashboard.router, prefix="/api")  # Add prefix here since router prefix is now just "/dashboard"
app.include_router(ai_assistance.router)

@app.get("/")
async def root():
    return {"message": "EduTech API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}