"""Authentication router"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.config import Settings, get_settings
from app.models import Token, LoginRequest
from app.auth import authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), settings: Settings = Depends(get_settings)
) -> Token:
    """Authenticate and return access token"""
    user = await authenticate_user(form_data.username, form_data.password, settings)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": user.username}, settings=settings, expires_delta=access_token_expires)

    return Token(access_token=access_token, token_type="bearer")


@router.post("/login-json", response_model=Token)
async def login_json(request: LoginRequest, settings: Settings = Depends(get_settings)) -> Token:
    """Authenticate with JSON payload and return access token"""
    user = await authenticate_user(request.username, request.password, settings)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": user.username}, settings=settings, expires_delta=access_token_expires)

    return Token(access_token=access_token, token_type="bearer")
