"""Pydantic schemas for Custom Dictionary API."""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class DictionaryEntry(BaseModel):
    """Custom dictionary entry."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    word: str = Field(..., description="Word to pronounce")
    pronunciation: str = Field(..., description="Desired pronunciation")
    category: str = Field("general", description="Category: name, term, abbreviation")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DictionaryCreate(BaseModel):
    """Create new entry."""

    word: str = Field(..., min_length=1, max_length=100)
    pronunciation: str = Field(..., min_length=1, max_length=200)
    category: str = Field("general")


class DictionaryUpdate(BaseModel):
    """Update entry."""

    word: str | None = None
    pronunciation: str | None = None
    category: str | None = None


class DictionaryListResponse(BaseModel):
    """List response."""

    entries: list[DictionaryEntry]
    total: int
    page: int = 1
    page_size: int = 20


class DictionaryImportRequest(BaseModel):
    """Batch import."""

    entries: list[DictionaryCreate]


class DictionaryExport(BaseModel):
    """Export response."""

    entries: list[dict]
    exported_at: datetime