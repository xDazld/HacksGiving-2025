"""Pydantic models for API requests and responses"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# Base models
class TimestampMixin(BaseModel):
    """Mixin for models with timestamps"""

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Cafe Tour models (used to manage small guided 'cafe' experiences in-app)
class CafeTourPart(BaseModel):
    """A part/section of a cafe tour"""

    id: str
    title: str
    content: str
    unlock_progress: float = Field(ge=0, le=100)
    recipe_url: Optional[str] = None


class CafeTourBase(BaseModel):
    """Base cafe tour model"""

    title: str = Field(min_length=1, max_length=200)
    description: str
    parts: list[CafeTourPart] = Field(default_factory=list)


class CafeTourCreate(CafeTourBase):
    """Model for creating a cafe tour"""

    pass


class CafeTourUpdate(BaseModel):
    """Model for updating a cafe tour"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    parts: Optional[list[CafeTourPart]] = None


class CafeTour(CafeTourBase, TimestampMixin):
    """Complete cafe tour model"""

    model_config = ConfigDict(from_attributes=True)

    id: str


# Plant models
class PlantBase(BaseModel):
    """Base plant model"""

    common_name: str
    scientific_name: str
    quantity: int = Field(ge=0)
    buy_new_wont_survive: bool = False
    buy_new_readily_available: bool = False
    move_by_staff: bool = False
    move_requires_consult: bool = False
    notes: Optional[str] = None
    dome_location: Optional[str] = None
    image_url: Optional[str] = None


class PlantCreate(PlantBase):
    """Model for creating a plant"""

    pass


class PlantUpdate(BaseModel):
    """Model for updating a plant"""

    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    buy_new_wont_survive: Optional[bool] = None
    buy_new_readily_available: Optional[bool] = None
    move_by_staff: Optional[bool] = None
    move_requires_consult: Optional[bool] = None
    notes: Optional[str] = None
    dome_location: Optional[str] = None
    image_url: Optional[str] = None


class Plant(PlantBase, TimestampMixin):
    """Complete plant model"""

    model_config = ConfigDict(from_attributes=True)

    id: str


# Progress tracking models
class BeaconData(BaseModel):
    """BLE beacon data for progress tracking"""

    ids: list[str] = Field(description="List of beacon/location context IDs")
    rssi: list[int] = Field(description="Signal strength values for each beacon")


class ProgressResponse(BaseModel):
    """Progress calculation response"""

    progress: float = Field(ge=0, le=100, description="Progress percentage through the dome")
    nearest_location: Optional[str] = None
    suggested_next: Optional[str] = None


class UserProgress(BaseModel):
    """User progress tracking"""

    user_id: str
    tour_id: Optional[str] = None
    progress_percentage: float = Field(ge=0, le=100)
    visited_locations: list[str] = Field(default_factory=list)
    completed_at: Optional[datetime] = None


# Ticket validation models
class BarcodeValidationRequest(BaseModel):
    """Request to validate a barcode"""

    barcode: str = Field(min_length=1)


class BarcodeValidationResponse(BaseModel):
    """Response from barcode validation"""

    valid: bool
    ticket_type: Optional[str] = None
    visitor_name: Optional[str] = None
    expiry_date: Optional[datetime] = None
    message: Optional[str] = None


# Authentication models
class Token(BaseModel):
    """JWT token response"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""

    username: Optional[str] = None


class User(BaseModel):
    """User model"""

    username: str
    disabled: Optional[bool] = False


class UserInDB(User):
    """User model with hashed password"""

    hashed_password: str


# Admin models
class LoginRequest(BaseModel):
    """Login request"""

    username: str
    password: str


# Analytics models
class AnalyticsOverview(BaseModel):
    """Overview analytics for the dashboard"""

    total_tours: int
    total_scavenger_hunts: int
    total_plants: int
    active_visitors: int
    today_visitors: int
    avg_completion_rate: float


# Context file models (used for LLM generation inputs)
class ContextFile(BaseModel):
    """Uploaded context file metadata"""

    id: str
    name: str
    size_original: int = Field(ge=0)
    mime_type: str | None = None
    created_at: datetime | None = None
