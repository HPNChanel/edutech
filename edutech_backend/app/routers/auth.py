from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, UserLogin, Token, UserRegister
from app.utils.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_current_active_user
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register")
async def register_user(user: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user with email, password, and full_name"""
    
    # Validate input data
    if not user.email or not user.email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    if not user.password or len(user.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    if not user.full_name or not user.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required"
        )
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user.email.lower().strip()))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            name=user.full_name.strip(),
            email=user.email.lower().strip(),
            hashed_password=hashed_password
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        
        # Return response matching frontend expectations
        return {
            "success": True,
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "name": db_user.name,
                "avatar": None
            },
            "tokens": {
                "accessToken": access_token,
                "refreshToken": access_token,  # For now, using same token
                "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            },
            "message": "User registered successfully"
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account. Please try again."
        )

@router.post("/login")
async def login_user(user_login: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password - JSON format"""
    
    # Validate input
    if not user_login.email or not user_login.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    
    # Find user by email
    result = await db.execute(select(User).where(User.email == user_login.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact support."
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Return response matching frontend expectations
    return {
        "success": True,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar": None
        },
        "tokens": {
            "accessToken": access_token,
            "refreshToken": access_token,  # For now, using same token
            "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        },
        "message": "Login successful"
    }

@router.post("/login-form", response_model=Token)
async def login_user_form(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Login with OAuth2 form format (for compatibility)"""
    
    # Find user by email (OAuth2 uses username field for email)
    result = await db.execute(select(User).where(User.email == form_data.username.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact support.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information
    
    Returns:
        200: User data if token is valid and user is active
        401: If token is invalid, expired, or user not found
        403: If user exists but is inactive/disabled
    """
    return {
        "success": True,
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "name": current_user.name,
            "avatar": None
        }
    }

@router.post("/logout")
async def logout_user(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout user - clears any server-side session data
    
    Note: Since we're using stateless JWT tokens, the actual token invalidation
    happens on the client side by removing the token from storage.
    This endpoint serves as a confirmation and can be extended to:
    - Add tokens to a blacklist (if implementing token blacklisting)
    - Clear any server-side session data
    - Log the logout event for audit purposes
    """
    
    # Future enhancement: Add token to blacklist if implementing token blacklisting
    # await add_token_to_blacklist(token)
    
    # Clear any cookies if using them (optional)
    response.delete_cookie("access_token", httponly=True, secure=True)
    
    return {
        "success": True,
        "message": "Successfully logged out"
    }

@router.post("/refresh")
async def refresh_token(
    refresh_token_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    refresh_token = refresh_token_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is required"
        )
    
    try:
        # Decode the refresh token to get user info
        payload = jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Check if user account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact support."
            )
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Create new refresh token
        refresh_token_expires = timedelta(days=7)  # Refresh tokens last longer
        new_refresh_token = create_access_token(
            data={"sub": user.email}, expires_delta=refresh_token_expires
        )
        
        return {
            "accessToken": new_access_token,
            "refreshToken": new_refresh_token,
            "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )