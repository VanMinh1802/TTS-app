"""Application configuration settings."""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # App
    APP_NAME: str = "GenVoice API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API
    API_V1_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/genvoice"

    # Auth - JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Auth - Google
    GOOGLE_CLIENT_ID: str = ""

    # Auth - Password
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_LETTER: bool = True
    PASSWORD_REQUIRE_NUMBER: bool = True

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # Cloudflare R2
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "genvoice-models"
    R2_ACCOUNT_ID: str = ""
    R2_PUBLIC_URL: str = ""
    SIGNED_URL_EXPIRE_SECONDS: int = 3600

    # Quota Management
    DEFAULT_QUOTA_TIER: str = "free"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()