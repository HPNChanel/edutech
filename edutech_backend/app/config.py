from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+aiomysql://root:HPNChanel1312$@localhost/edutech"
    JWT_SECRET_KEY: str = "tx4`lA/cev3NK},tl5fM`&2FR}qj@81KQi6QSSO0Vx`@kJbZf!2d9}iOvC(EmEz:"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DEBUG: bool = True
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()