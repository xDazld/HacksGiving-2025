"""Application configuration management using pydantic-settings"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App settings
    app_name: str = "Milwaukee Domes Management"
    app_version: str = "0.1.0"
    debug: bool = False

    # API settings
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["*"]

    # Appwrite settings
    appwrite_endpoint: str = "https://cloud.appwrite.io/v1"
    appwrite_project_id: str
    appwrite_api_key: str
    appwrite_database_id: str = "milwaukee-domes"

    # Collection IDs
    tours_collection_id: str = "tours"
    scavenger_hunts_collection_id: str = "scavenger-hunts"
    cafe_tours_collection_id: str = "cafe-tours"
    plants_collection_id: str = "plants"
    progress_collection_id: str = "progress"
    tickets_collection_id: str = "tickets"

    # JWT settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Admin credentials
    admin_username: str = "admin"
    admin_password: str  # Should be set via environment variable


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
