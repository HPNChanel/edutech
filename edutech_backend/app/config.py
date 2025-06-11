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