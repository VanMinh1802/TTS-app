"""Database models."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


from app.models.analytics import RequestLog, UsageSnapshot
from app.models.dictionary import DictionaryEntryModel
from app.models.quota import UserQuota, UsageHistory
from app.models.user import APIKey, User
from app.models.audio_record import AudioRecord
from app.models.license import LicenseKey

__all__ = [
    "Base",
    "User",
    "APIKey",
    "UserQuota",
    "UsageHistory",
    "DictionaryEntryModel",
    "RequestLog",
    "UsageSnapshot",
    "AudioRecord",
    "LicenseKey",
]
