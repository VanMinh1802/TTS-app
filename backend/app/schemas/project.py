"""Project Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SegmentBase(BaseModel):
    """Base segment schema."""
    text: str = Field(..., max_length=5000)
    voice_id: str


class SegmentCreate(SegmentBase):
    """Schema for creating a segment."""
    pass


class SegmentResponse(SegmentBase):
    """Schema for segment response."""
    id: str
    order: int

    class Config:
        from_attributes = True


class SegmentUpdate(BaseModel):
    """Schema for updating a segment."""
    text: Optional[str] = Field(None, max_length=5000)
    voice_id: Optional[str] = None
    order: Optional[int] = None


class SceneBase(BaseModel):
    """Base scene schema."""
    name: str = Field(..., max_length=100)


class SceneCreate(SceneBase):
    """Schema for creating a scene."""
    pass


class SceneResponse(SceneBase):
    """Schema for scene response."""
    id: str
    order: int
    segments: list[SegmentResponse] = []

    class Config:
        from_attributes = True


class SceneUpdate(BaseModel):
    """Schema for updating a scene."""
    name: Optional[str] = Field(None, max_length=100)
    order: Optional[int] = None


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    pass


class ProjectResponse(ProjectBase):
    """Schema for project response."""
    id: str
    created_at: datetime
    updated_at: datetime
    scenes: list[SceneResponse] = []
    scene_count: int = 0
    segment_count: int = 0

    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class ProjectListItem(BaseModel):
    """Schema for project list item."""
    id: str
    name: str
    description: Optional[str] = None
    scene_count: int
    segment_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True