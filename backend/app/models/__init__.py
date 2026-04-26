"""Database models."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


from app.models.analytics import RequestLog, UsageSnapshot
from app.models.dictionary import DictionaryEntryModel
from app.models.project import Project, ProjectExportJob, Scene, Segment
from app.models.quota import UserQuota, UsageHistory
from app.models.user import APIKey, User
from app.models.voice import Voice
from app.models.audio_record import AudioRecord
from app.models.license import LicenseKey

__all__ = [
    "Base",
    "User",
    "APIKey",
    "Project",
    "Scene",
    "Segment",
    "ProjectExportJob",
    "UserQuota",
    "UsageHistory",
    "DictionaryEntryModel",
    "Voice",
    "RequestLog",
    "UsageSnapshot",
    "AudioRecord",
    "LicenseKey",
]
