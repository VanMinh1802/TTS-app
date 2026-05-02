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
    GOOGLE_CLIENT_SECRET: str = ""

    # Auth - Cookie / CSRF
    AUTH_COOKIE_NAME: str = "access_token"
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: str = "lax"
    AUTH_COOKIE_PATH: str = "/"
    AUTH_COOKIE_MAX_AGE: int = 60 * 60 * 24
    CSRF_COOKIE_NAME: str = "csrf_token"
    CSRF_HEADER_NAME: str = "X-CSRF-Token"
    CSRF_COOKIE_SECURE: bool = False
    CSRF_COOKIE_SAMESITE: str = "lax"
    CSRF_COOKIE_PATH: str = "/"
    CSRF_COOKIE_MAX_AGE: int = 60 * 60 * 24

    # Auth - Password
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_LETTER: bool = True
    PASSWORD_REQUIRE_NUMBER: bool = True

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # Cloudflare R2 (TTS Models)
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "genvoice-models"
    R2_ACCOUNT_ID: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_PUBLIC_URL: str = ""
    SIGNED_URL_EXPIRE_SECONDS: int = 3600

    # Cloudflare R2 (Audio Library)
    R2_LIBRARY_ACCESS_KEY_ID: str = ""
    R2_LIBRARY_SECRET_ACCESS_KEY: str = ""
    R2_LIBRARY_BUCKET_NAME: str = "tts-app-library"
    R2_LIBRARY_PUBLIC_URL: str = ""

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


def get_r2_public_base_url() -> str:
    """Return the configured public R2 base URL."""
    return settings.R2_PUBLIC_URL or f"https://{settings.R2_ACCOUNT_ID}.r2.dev"


def get_r2_client_endpoint() -> str:
    """Return the configured R2 client endpoint URL."""
    return settings.R2_ENDPOINT_URL or f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
