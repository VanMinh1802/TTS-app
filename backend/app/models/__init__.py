"""Database models."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


from app.models.project import Project, Scene, Segment
from app.models.quota import UserQuota, UsageHistory
from app.models.user import APIKey, User
from app.models.voice import Voice

__all__ = ["Base", "User", "APIKey", "Project", "Scene", "Segment", "UserQuota", "UsageHistory", "Voice"]
