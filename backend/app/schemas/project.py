"""Project Pydantic schemas."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SegmentBase(BaseModel):
    """Base segment schema."""
    text: str = Field(..., max_length=5000)
    voice_id: str = "default"
    emotion_params: Optional[dict] = Field(default=None)


class SegmentCreate(SegmentBase):
    """Schema for creating a segment."""
    pass


class SegmentResponse(SegmentBase):
    """Schema for segment response."""
    id: str
    order: int

    model_config = ConfigDict(from_attributes=True)


class SegmentUpdate(BaseModel):
    """Schema for updating a segment."""
    text: Optional[str] = Field(None, max_length=5000)
    voice_id: Optional[str] = None
    order: Optional[int] = None
    emotion_params: Optional[dict] = None


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
    segments: list[SegmentResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


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
    scenes: list[SceneResponse] = Field(default_factory=list)
    scene_count: int = 0
    segment_count: int = 0

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


class SegmentReorderRequest(BaseModel):
    """Schema for segment reorder requests."""

    scene_id: str
    segment_ids: list[str] = Field(min_length=1)


class SegmentReorderResponse(BaseModel):
    """Schema for segment reorder responses."""

    success: bool


ExportFormat = Literal["single", "chapters", "segments"]
ExportStatus = Literal["processing", "completed", "failed"]


class ProjectExportRequest(BaseModel):
    """Schema for project export requests."""

    format: ExportFormat
    gap_seconds: float = Field(default=1.0, ge=0.0, le=30.0)


class ProjectExportResponse(BaseModel):
    """Schema for project export start response."""

    job_id: str
    status: ExportStatus


class ProjectExportStatusResponse(BaseModel):
    """Schema for project export status polling response."""

    job_id: str
    status: ExportStatus
    progress: int = Field(ge=0, le=100)
    error: Optional[str] = None
