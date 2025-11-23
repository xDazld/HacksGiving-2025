"""Authentication utilities"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import Settings, get_settings
from app.models import TokenData, User, UserInDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Module-level hashed password for admin user
_admin_hashed_password = None

# Bcrypt has a 72-byte password limit
MAX_PASSWORD_BYTES = 72


def _prepare_password(password: str) -> bytes:
    """Prepare password for bcrypt by ensuring it's within the 72-byte limit.

    Bcrypt has a maximum password length of 72 bytes. This function ensures
    passwords are safely truncated to this limit while preserving UTF-8 encoding.

    Args:
        password: The password string to prepare

    Returns:
        Password bytes truncated to 72 bytes if necessary
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        # Truncate to 72 bytes
        return password_bytes[:MAX_PASSWORD_BYTES]
    return password_bytes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash using bcrypt.

    Note: Passwords are truncated to 72 bytes to comply with bcrypt's limit.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The bcrypt hash to verify against

    Returns:
        True if password matches, False otherwise
    """
    password_bytes = _prepare_password(plain_password)
    hash_bytes = hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password
    return bcrypt.checkpw(password_bytes, hash_bytes)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt.

    Note: Passwords are truncated to 72 bytes to comply with bcrypt's limit.
    This is a known bcrypt limitation and is applied consistently during
    both hashing and verification.

    Args:
        password: The password to hash

    Returns:
        The bcrypt hash as a string
    """
    password_bytes = _prepare_password(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict, settings: Settings, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def get_user(username: str, settings: Settings) -> Optional[UserInDB]:
    """Get user from database (currently only supports admin user from settings)"""
    global _admin_hashed_password
    if username == settings.admin_username:
        # Use pre-hashed password from startup
        if _admin_hashed_password is None:
            # Fallback for testing or if startup didn't run
            _admin_hashed_password = get_password_hash(settings.admin_password)
        return UserInDB(
            username=settings.admin_username,
            hashed_password=_admin_hashed_password,
            disabled=False,
        )
    return None


def initialize_admin_password(settings: Settings) -> None:
    """Initialize admin password hash at startup"""
    global _admin_hashed_password
    _admin_hashed_password = get_password_hash(settings.admin_password)


async def authenticate_user(username: str, password: str, settings: Settings) -> Optional[UserInDB]:
    """Authenticate a user"""
    user = get_user(username, settings)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), settings: Settings = Depends(get_settings)) -> User:
    """Get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user(username=token_data.username, settings=settings)
    if user is None:
        raise credentials_exception
    return User(username=user.username, disabled=user.disabled)


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user"""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
