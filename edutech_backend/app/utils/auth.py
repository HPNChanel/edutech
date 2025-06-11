from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Logger for debugging authentication issues
logger = logging.getLogger(__name__)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Decode JWT token and return user if token is valid and user exists.
    
    Returns:
        User: The user object if token is valid and user exists (regardless of active status)
        
    Raises:
        HTTPException 401: If token is invalid, expired, missing, tampered, or user not found
    """
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Extract user email from 'sub' field
        email: str = payload.get("sub")
        if email is None:
            if settings.DEBUG:
                logger.warning("Token missing user identifier (sub field)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token_data = TokenData(email=email)
        
    except JWTError as e:
        # Token is invalid, expired, or tampered
        if settings.DEBUG:
            logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Load user from database
    try:
        result = await db.execute(select(User).where(User.email == token_data.email))
        user = result.scalar_one_or_none()
        
        if user is None:
            # User not found in database
            if settings.DEBUG:
                logger.warning(f"User not found in database for email: {token_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Log successful authentication for debugging
        if settings.DEBUG:
            logger.info(f"User authenticated successfully: {user.email} (ID: {user.id}, Active: {user.is_active})")
        
        return user
        
    except HTTPException:
        # Re-raise HTTPExceptions (like user not found)
        raise
    except Exception as e:
        # Database error or other unexpected error
        if settings.DEBUG:
            logger.error(f"Database error during user lookup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if the current user is active.
    
    Args:
        current_user: User object from get_current_user dependency
        
    Returns:
        User: The user object if user is active
        
    Raises:
        HTTPException 403: If user exists but is inactive/disabled
    """
    if not current_user.is_active:
        if settings.DEBUG:
            logger.warning(f"Inactive user attempted access: {current_user.email} (ID: {current_user.id})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    
    return current_user