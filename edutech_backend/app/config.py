from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+aiomysql://root:HPNChanel1312$@localhost/edutech"
    JWT_SECRET_KEY: str = "tx4`lA/cev3NK},tl5fM`&2FR}qj@81KQi6QSSO0Vx`@kJbZf!2d9}iOvC(EmEz:"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DEBUG: bool = True
    UPLOAD_DIR: str = "uploads"
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = "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"  # Set this in .env file
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 150  # Limit tokens for cost optimization
    OPENAI_TEMPERATURE: float = 0.7
    
    class Config:
        env_file = ".env"

settings = Settings()