# Phase 5 - Project Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement project-based TTS workflow (F5.1-F5.5) - CRUD API, list UI, scene/segment editor, timeline, export

**Architecture:** 
- Backend: FastAPI with SQLAlchemy ORM, projects/scenes/segments tables
- Frontend: Next.js with React Query, drag-drop timeline using @dnd-kit
- Export: Async job processing with polling

---

## Backend Implementation

### Task 1: Project Database Models

**Files:** `backend/app/models/project.py`, `backend/app/schemas/project.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_project_models.py
import pytest
from app.models.project import Project, Scene, Segment

def test_project_has_name_field():
    project = Project(name="Test Project")
    assert project.name == "Test Project"

def test_project_has_user_relationship():
    from app.models.user import User
    user = User(email="test@test.com", hashed_password="hash")
    project = Project(name="Test", user_id=user.id)
    assert project.user_id == user.id
```

**[RED]** Run: `pytest backend/tests/test_project_models.py -v`
**Expected:** FAIL — "No module named 'app.models.project'"

**[GREEN]** Write minimal implementation:

```python
# backend/app/models/project.py
"""Project, Scene, Segment database models."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class Project(Base):
    """Project entity - contains scenes and segments."""
    
    __tablename__ = "projects"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    scenes: Mapped[list["Scene"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class Scene(Base):
    """Scene entity - contains segments within a project."""
    
    __tablename__ = "scenes"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    project: Mapped["Project"] = relationship(back_populates="scenes")
    segments: Mapped[list["Segment"]] = relationship(back_populates="scene", cascade="all, delete-orphan")


class Segment(Base):
    """Segment entity - text content with voice for TTS generation."""
    
    __tablename__ = "segments"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scene_id: Mapped[str] = mapped_column(String(36), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    voice_id: Mapped[str] = mapped_column(String(50), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    audio_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    scene: Mapped["Scene"] = relationship(back_populates="segments")
```

```python
# backend/app/schemas/project.py
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
```

**[GREEN]** Run: `pytest backend/tests/test_project_models.py -v`
**Expected:** PASS

**[REFACTOR]** Add `__init__.py` exports if needed

---

### Task 2: Project Service

**Files:** `backend/app/services/project_service.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_project_service.py
import pytest
from app.services.project_service import ProjectService
from app.db import get_test_db

def test_create_project():
    service = ProjectService(next(get_test_db()))
    project = service.create_project(user_id="user-123", name="Test Project")
    assert project.name == "Test Project"
    assert project.user_id == "user-123"
```

**[RED]** Run: `pytest backend/tests/test_project_service.py -v`
**Expected:** FAIL — "No module named 'app.services.project_service'"

**[GREEN]** Write minimal implementation:

```python
# backend/app/services/project_service.py
"""Project business logic service."""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.project import Project, Scene, Segment
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    SceneCreate,
    SceneUpdate,
    SegmentCreate,
    SegmentUpdate,
)


class ProjectService:
    """Service for project CRUD operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_project(self, user_id: str, data: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            user_id=user_id,
            name=data.name,
            description=data.description,
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def get_user_projects(self, user_id: str) -> list[Project]:
        """Get all projects for a user."""
        return self.db.query(Project).filter(Project.user_id == user_id).all()
    
    def get_project(self, project_id: str, user_id: str) -> Optional[Project]:
        """Get a project by ID for a specific user."""
        return self.db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user_id,
        ).first()
    
    def update_project(self, project_id: str, user_id: str, data: ProjectUpdate) -> Optional[Project]:
        """Update a project."""
        project = self.get_project(project_id, user_id)
        if not project:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        
        project.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def delete_project(self, project_id: str, user_id: str) -> bool:
        """Delete a project."""
        project = self.get_project(project_id, user_id)
        if not project:
            return False
        
        self.db.delete(project)
        self.db.commit()
        return True
    
    def duplicate_project(self, project_id: str, user_id: str) -> Optional[Project]:
        """Duplicate a project with all scenes and segments."""
        original = self.get_project(project_id, user_id)
        if not original:
            return None
        
        new_project = Project(
            user_id=user_id,
            name=f"{original.name} (copy)",
            description=original.description,
        )
        self.db.add(new_project)
        self.db.flush()
        
        for scene in original.scenes:
            new_scene = Scene(
                project_id=new_project.id,
                name=scene.name,
                order_index=scene.order_index,
            )
            self.db.add(new_scene)
            self.db.flush()
            
            for segment in scene.segments:
                new_segment = Segment(
                    scene_id=new_scene.id,
                    text=segment.text,
                    voice_id=segment.voice_id,
                    order_index=segment.order_index,
                )
                self.db.add(new_segment)
        
        self.db.commit()
        self.db.refresh(new_project)
        return new_project
    
    # Scene operations
    def create_scene(self, project_id: str, user_id: str, data: SceneCreate) -> Optional[Scene]:
        """Create a new scene in a project."""
        project = self.get_project(project_id, user_id)
        if not project:
            return None
        
        max_order = max([s.order_index for s in project.scenes], default=-1)
        scene = Scene(
            project_id=project_id,
            name=data.name,
            order_index=max_order + 1,
        )
        self.db.add(scene)
        self.db.commit()
        self.db.refresh(scene)
        return scene
    
    def update_scene(self, scene_id: str, project_id: str, user_id: str, data: SceneUpdate) -> Optional[Scene]:
        """Update a scene."""
        project = self.get_project(project_id, user_id)
        if not project:
            return None
        
        scene = next((s for s in project.scenes if s.id == scene_id), None)
        if not scene:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(scene, field, value)
        
        self.db.commit()
        self.db.refresh(scene)
        return scene
    
    def delete_scene(self, scene_id: str, project_id: str, user_id: str) -> bool:
        """Delete a scene."""
        project = self.get_project(project_id, user_id)
        if not project:
            return False
        
        scene = next((s for s in project.scenes if s.id == scene_id), None)
        if not scene:
            return False
        
        self.db.delete(scene)
        self.db.commit()
        return True
    
    # Segment operations
    def create_segment(self, scene_id: str, project_id: str, user_id: str, data: SegmentCreate) -> Optional[Segment]:
        """Create a new segment in a scene."""
        project = self.get_project(project_id, user_id)
        if not project:
            return None
        
        scene = next((s for s in project.scenes if s.id == scene_id), None)
        if not scene:
            return None
        
        max_order = max([seg.order_index for seg in scene.segments], default=-1)
        segment = Segment(
            scene_id=scene_id,
            text=data.text,
            voice_id=data.voice_id,
            order_index=max_order + 1,
        )
        self.db.add(segment)
        self.db.commit()
        self.db.refresh(segment)
        return segment
    
    def update_segment(self, segment_id: str, project_id: str, user_id: str, data: SegmentUpdate) -> Optional[Segment]:
        """Update a segment."""
        project = self.get_project(project_id, user_id)
        if not project:
            return None
        
        segment = None
        for scene in project.scenes:
            segment = next((s for s in scene.segments if s.id == segment_id), None)
            if segment:
                break
        
        if not segment:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "order":
                field = "order_index"
            setattr(segment, field, value)
        
        self.db.commit()
        self.db.refresh(segment)
        return segment
    
    def delete_segment(self, segment_id: str, project_id: str, user_id: str) -> bool:
        """Delete a segment."""
        project = self.get_project(project_id, user_id)
        if not project:
            return False
        
        segment = None
        for scene in project.scenes:
            segment = next((s for s in scene.segments if s.id == segment_id), None)
            if segment:
                break
        
        if not segment:
            return False
        
        self.db.delete(segment)
        self.db.commit()
        return True
    
    def reorder_segments(self, project_id: str, user_id: str, segment_ids: list[str]) -> bool:
        """Reorder segments by IDs list."""
        project = self.get_project(project_id, user_id)
        if not project:
            return False
        
        for index, seg_id in enumerate(segment_ids):
            for scene in project.scenes:
                segment = next((s for s in scene.segments if s.id == seg_id), None)
                if segment:
                    segment.order_index = index
                    break
        
        self.db.commit()
        return True
```

**[GREEN]** Run: `pytest backend/tests/test_project_service.py -v`
**Expected:** PASS

---

### Task 3: Project API Endpoints

**Files:** `backend/app/api/projects.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_projects_api.py
import pytest
from fastapi.testclient import TestClient

def test_create_project_endpoint(client):
    response = client.post("/api/projects", json={"name": "Test"})
    assert response.status_code == 401  # Not authenticated
```

**[RED]** Run: `pytest backend/tests/test_projects_api.py -v`
**Expected:** FAIL — "No route /api/projects"

**[GREEN]** Write implementation:

```python
# backend/app/api/projects.py
"""Project API routes."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectListItem,
    ProjectResponse,
    ProjectUpdate,
    SceneCreate,
    SceneResponse,
    SceneUpdate,
    SegmentCreate,
    SegmentResponse,
    SegmentUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    """Get project service instance."""
    return ProjectService(db)


# ===== Project Endpoints =====


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Create a new project."""
    project = service.create_project(current_user.id, project_data)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        scenes=[],
    )


@router.get("", response_model=list[ProjectListItem])
def list_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """List all projects for the current user."""
    projects = service.get_user_projects(current_user.id)
    return [
        ProjectListItem(
            id=p.id,
            name=p.name,
            description=p.description,
            scene_count=len(p.scenes),
            segment_count=sum(len(s.segments) for s in p.scenes),
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Get a project by ID."""
    project = service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    scenes = [
        SceneResponse(
            id=s.id,
            name=s.name,
            order=s.order_index,
            segments=[
                SegmentResponse(
                    id=seg.id,
                    text=seg.text,
                    voice_id=seg.voice_id,
                    order=seg.order_index,
                )
                for seg in sorted(s.segments, key=lambda x: x.order_index)
            ],
        )
        for s in sorted(project.scenes, key=lambda x: x.order_index)
    ]
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        scenes=scenes,
        scene_count=len(project.scenes),
        segment_count=sum(len(s.segments) for s in project.scenes),
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Update a project."""
    project = service.update_project(project_id, current_user.id, project_data)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Delete a project."""
    success = service.delete_project(project_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def duplicate_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Duplicate a project."""
    project = service.duplicate_project(project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    scenes = [
        SceneResponse(
            id=s.id,
            name=s.name,
            order=s.order_index,
            segments=[
                SegmentResponse(
                    id=seg.id,
                    text=seg.text,
                    voice_id=seg.voice_id,
                    order=seg.order_index,
                )
                for seg in sorted(s.segments, key=lambda x: x.order_index)
            ],
        )
        for s in sorted(project.scenes, key=lambda x: x.order_index)
    ]
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        scenes=scenes,
    )


# ===== Scene Endpoints =====


@router.post("/{project_id}/scenes", response_model=SceneResponse, status_code=status.HTTP_201_CREATED)
def create_scene(
    project_id: str,
    scene_data: SceneCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Create a new scene in a project."""
    scene = service.create_scene(project_id, current_user.id, scene_data)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    return SceneResponse(
        id=scene.id,
        name=scene.name,
        order=scene.order_index,
        segments=[],
    )


@router.put("/{project_id}/scenes/{scene_id}", response_model=SceneResponse)
def update_scene(
    project_id: str,
    scene_id: str,
    scene_data: SceneUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Update a scene."""
    scene = service.update_scene(scene_id, project_id, current_user.id, scene_data)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    
    return SceneResponse(
        id=scene.id,
        name=scene.name,
        order=scene.order_index,
        segments=[],
    )


@router.delete("/{project_id}/scenes/{scene_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scene(
    project_id: str,
    scene_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Delete a scene."""
    success = service.delete_scene(scene_id, project_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ===== Segment Endpoints =====


@router.post("/{project_id}/scenes/{scene_id}/segments", response_model=SegmentResponse, status_code=status.HTTP_201_CREATED)
def create_segment(
    project_id: str,
    scene_id: str,
    segment_data: SegmentCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Create a new segment in a scene."""
    segment = service.create_segment(scene_id, project_id, current_user.id, segment_data)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    
    return SegmentResponse(
        id=segment.id,
        text=segment.text,
        voice_id=segment.voice_id,
        order=segment.order_index,
    )


@router.put("/{project_id}/segments/{segment_id}", response_model=SegmentResponse)
def update_segment(
    project_id: str,
    segment_id: str,
    segment_data: SegmentUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Update a segment."""
    segment = service.update_segment(segment_id, project_id, current_user.id, segment_data)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Segment not found",
        )
    
    return SegmentResponse(
        id=segment.id,
        text=segment.text,
        voice_id=segment.voice_id,
        order=segment.order_index,
    )


@router.delete("/{project_id}/segments/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_segment(
    project_id: str,
    segment_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Delete a segment."""
    success = service.delete_segment(segment_id, project_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Segment not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/segments/reorder", status_code=status.HTTP_200_OK)
def reorder_segments(
    project_id: str,
    segment_ids: list[str],
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Reorder segments by providing ordered list of segment IDs."""
    success = service.reorder_segments(project_id, current_user.id, segment_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return {"success": True}
```

---

### Task 4: Register Project Routes

**Files:** `backend/app/main.py`

---

```python
# backend/app/main.py - Add this import and router
from app.api import projects

app.include_router(projects.router)
```

---

## Frontend Implementation (F5.2-F5.5)

### Task 5: Project Types

**Files:** `frontend/src/features/projects/types/project-types.ts`

---

```typescript
// frontend/src/features/projects/types/project-types.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  scenes: Scene[];
  scene_count: number;
  segment_count: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  scene_count: number;
  segment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  name: string;
  order: number;
  segments: Segment[];
}

export interface Segment {
  id: string;
  text: string;
  voice_id: string;
  order: number;
}

export interface CreateProject {
  name: string;
  description?: string;
}

export interface UpdateProject {
  name?: string;
  description?: string;
}

export interface CreateScene {
  name: string;
}

export interface CreateSegment {
  text: string;
  voice_id: string;
}

export interface UpdateSegment {
  text?: string;
  voice_id?: string;
  order?: number;
}

export type ExportFormat = "single" | "chapters" | "segments";

export interface ExportJob {
  job_id: string;
  status: "processing" | "completed" | "failed";
  progress?: number;
  error?: string;
}
```

---

### Task 6: Project API Client

**Files:** `frontend/src/features/projects/api/projects-api.ts`

---

```typescript
// frontend/src/features/projects/api/projects-api.ts
import { API_URL } from "@/lib/config";
import { getAuthHeaders } from "@/lib/auth";
import type {
  Project,
  ProjectListItem,
  CreateProject,
  UpdateProject,
  CreateScene,
  CreateSegment,
  UpdateSegment,
  ExportJob,
  ExportFormat,
} from "../types/project-types";

const API_BASE = `${API_URL}/projects`;

export async function listProjects(): Promise<ProjectListItem[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function getProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function createProject(data: CreateProject): Promise<Project> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(id: string, data: UpdateProject): Promise<Project> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function duplicateProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/${id}/duplicate`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to duplicate project");
  return res.json();
}

export async function createScene(projectId: string, data: CreateScene) {
  const res = await fetch(`${API_BASE}/${projectId}/scenes`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create scene");
  return res.json();
}

export async function createSegment(
  projectId: string,
  sceneId: string,
  data: CreateSegment
) {
  const res = await fetch(`${API_BASE}/${projectId}/scenes/${sceneId}/segments`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create segment");
  return res.json();
}

export async function updateSegment(
  projectId: string,
  segmentId: string,
  data: UpdateSegment
) {
  const res = await fetch(`${API_BASE}/${projectId}/segments/${segmentId}`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update segment");
  return res.json();
}

export async function deleteSegment(projectId: string, segmentId: string) {
  const res = await fetch(`${API_BASE}/${projectId}/segments/${segmentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete segment");
}

export async function reorderSegments(projectId: string, segmentIds: string[]) {
  const res = await fetch(`${API_BASE}/${projectId}/segments/reorder`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(segmentIds),
  });
  if (!res.ok) throw new Error("Failed to reorder segments");
  return res.json();
}

export async function exportProject(
  projectId: string,
  format: ExportFormat,
  gapSeconds: number = 1
): Promise<ExportJob> {
  const res = await fetch(`${API_BASE}/${projectId}/export`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ format, gap_seconds: gapSeconds }),
  });
  if (!res.ok) throw new Error("Failed to start export");
  return res.json();
}

export async function getExportStatus(
  projectId: string,
  jobId: string
): Promise<ExportJob> {
  const res = await fetch(`${API_BASE}/${projectId}/export/${jobId}/status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to get export status");
  return res.json();
}

export async function downloadExport(projectId: string, jobId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/${projectId}/export/${jobId}/download`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to download export");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
```

---

### Task 7: Project List Page (F5.2)

**Files:** `frontend/src/app/projects/page.tsx`, `frontend/src/components/project/ProjectCard.tsx`

---

```typescript
// frontend/src/app/projects/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, createProject, deleteProject } from "@/features/projects/api/projects-api";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function ProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      window.location.href = `/projects/${newProject.id}`;
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Success", description: "Project deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Project</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Button onClick={() => setIsCreateOpen(true)}>Create your first project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
```

```typescript
// frontend/src/components/project/ProjectCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateProject, deleteProject } from "@/features/projects/api/projects-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProjectListItem } from "@/features/projects/types/project-types";
import { useToast } from "@/components/ui/use-toast";

interface ProjectCardProps {
  project: ProjectListItem;
  onDelete: () => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Success", description: "Project duplicated" });
    },
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    return d.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
      <CardHeader>
        <CardTitle className="text-lg">{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || "No description"}
        </p>
        <div className="flex gap-2 mt-4">
          <span className="text-xs bg-secondary px-2 py-1 rounded">
            {project.scene_count} scenes
          </span>
          <span className="text-xs bg-secondary px-2 py-1 rounded">
            {project.segment_count} segments
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          {formatDate(project.updated_at)}
        </p>
        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => duplicateMutation.mutate()}
          >
            Duplicate
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 8: Project Editor Page (F5.3-F5.4)

**Files:** `frontend/src/app/projects/[id]/page.tsx`

---

```typescript
// frontend/src/app/projects/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, createScene, createSegment, updateSegment, deleteSegment, reorderSegments } from "@/features/projects/api/projects-api";
import { SceneSidebar } from "@/components/project/SceneSidebar";
import { SegmentEditor } from "@/components/project/SegmentEditor";
import { Timeline } from "@/components/project/Timeline";
import { ExportModal } from "@/components/project/ExportModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { Scene, Segment } from "@/features/projects/types/project-types";

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const createSceneMutation = useMutation({
    mutationFn: createScene.bind(null, projectId),
    onSuccess: (newScene) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setSelectedSceneId(newScene.id);
    },
  });

  const createSegmentMutation = useMutation({
    mutationFn: ({ sceneId, data }: { sceneId: string; data: { text: string; voice_id: string } }) =>
      createSegment(projectId, sceneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const updateSegmentMutation = useMutation({
    mutationFn: ({ segmentId, data }: { segmentId: string; data: { text?: string; voice_id?: string } }) =>
      updateSegment(projectId, segmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: (segmentId: string) => deleteSegment(projectId, segmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setSelectedSegmentId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (segmentIds: string[]) => reorderSegments(projectId, segmentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  useEffect(() => {
    if (project?.scenes?.length && !selectedSceneId) {
      setSelectedSceneId(project.scenes[0].id);
    }
  }, [project, selectedSceneId]);

  const selectedScene = project?.scenes?.find((s) => s.id === selectedSceneId);

  const handleReorder = useCallback((newOrder: Segment[]) => {
    reorderMutation.mutate(newOrder.map((s) => s.id));
  }, [reorderMutation]);

  if (isLoading) {
    return <div className="container py-8">Loading...</div>;
  }

  if (!project) {
    return <div className="container py-8">Project not found</div>;
  }

  return (
    <div className="flex h-screen">
      <SceneSidebar
        scenes={project.scenes}
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
        onAddScene={() => createSceneMutation.mutate({ name: `Scene ${(project.scenes?.length || 0) + 1}` })}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsExportOpen(true)}>
              Export
            </Button>
            <Button onClick={() => createSegmentMutation.mutate({ sceneId: selectedSceneId, data: { text: "New segment", voice_id: "default" } })} disabled={!selectedSceneId}>
              Add Segment
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          <SegmentEditor
            scene={selectedScene}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={setSelectedSegmentId}
            onUpdateSegment={(data) => selectedSegmentId && updateSegmentMutation.mutate({ segmentId: selectedSegmentId, data })}
            onDeleteSegment={(id) => deleteSegmentMutation.mutate(id)}
          />
        </div>

        <Timeline
          segments={selectedScene?.segments || []}
          onReorder={handleReorder}
          selectedSegmentId={selectedSegmentId}
          onSelectSegment={setSelectedSegmentId}
        />
      </div>

      <ExportModal
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        projectId={projectId}
      />
    </div>
  );
}
```

---

### Task 9: Supporting Components

**Files:** 
- `frontend/src/components/project/SceneSidebar.tsx`
- `frontend/src/components/project/SegmentEditor.tsx`
- `frontend/src/components/project/Timeline.tsx`
- `frontend/src/components/project/CreateProjectModal.tsx`
- `frontend/src/components/project/ExportModal.tsx`

---

```typescript
// frontend/src/components/project/SceneSidebar.tsx
"use client";

import type { Scene } from "@/features/projects/types/project-types";

interface SceneSidebarProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
}

export function SceneSidebar({ scenes, selectedSceneId, onSelectScene, onAddScene }: SceneSidebarProps) {
  return (
    <div className="w-64 border-r p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Scenes</h2>
        <Button size="sm" onClick={onAddScene}>+</Button>
      </div>
      <div className="space-y-2">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className={`p-2 rounded cursor-pointer ${selectedSceneId === scene.id ? "bg-secondary" : "hover:bg-muted"}`}
            onClick={() => onSelectScene(scene.id)}
          >
            <p className="font-medium">{scene.name}</p>
            <p className="text-xs text-muted-foreground">{scene.segments?.length || 0} segments</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/project/SegmentEditor.tsx
"use client";

import { useState, useEffect } from "react";
import type { Scene, Segment } from "@/features/projects/types/project-types";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SegmentEditorProps {
  scene?: Scene;
  selectedSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  onUpdateSegment: (data: { text: string; voice_id: string }) => void;
  onDeleteSegment: (id: string) => void;
}

export function SegmentEditor({ scene, selectedSegmentId, onSelectSegment, onUpdateSegment, onDeleteSegment }: SegmentEditorProps) {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("default");

  const selectedSegment = scene?.segments?.find((s) => s.id === selectedSegmentId);

  useEffect(() => {
    if (selectedSegment) {
      setText(selectedSegment.text);
      setVoiceId(selectedSegment.voice_id);
    }
  }, [selectedSegment]);

  if (!scene || !selectedSegment) {
    return <div className="flex-1 p-4">Select a segment to edit</div>;
  }

  return (
    <div className="flex-1 p-4 space-y-4">
      <div>
        <label className="text-sm font-medium">Voice</label>
        <Input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Text</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => onUpdateSegment({ text, voice_id: voiceId })}
          rows={10}
        />
        <p className="text-xs text-muted-foreground mt-1">{text.length}/5000 characters</p>
      </div>
      <Button variant="destructive" onClick={() => onDeleteSegment(selectedSegmentId!)}>
        Delete Segment
      </Button>
    </div>
  );
}
```

```typescript
// frontend/src/components/project/Timeline.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Segment } from "@/features/projects/types/project-types";

interface TimelineProps {
  segments: Segment[];
  onReorder: (segments: Segment[]) => void;
  selectedSegmentId: string | null;
  onSelectSegment: (id: string) => void;
}

function SortableSegment({ segment, isSelected, onClick }: { segment: Segment; isSelected: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: segment.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 rounded border cursor-move ${isSelected ? "border-primary" : "border-border"}`}
      onClick={onClick}
    >
      <p className="text-sm truncate">{segment.text.slice(0, 50)}...</p>
      <span className="text-xs text-muted-foreground">{segment.voice_id}</span>
    </div>
  );
}

export function Timeline({ segments, onReorder, selectedSegmentId, onSelectSegment }: TimelineProps) {
  const sortedSegments = [...(segments || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="h-32 border-t p-4 overflow-x-auto">
      <div className="flex gap-2">
        {sortedSegments.map((segment) => (
          <SortableSegment
            key={segment.id}
            segment={segment}
            isSelected={selectedSegmentId === segment.id}
            onClick={() => onSelectSegment(segment.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/project/CreateProjectModal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string }) => void;
}

export function CreateProjectModal({ open, onOpenChange, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSubmit({ name, description });
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Project" />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project description" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

```typescript
// frontend/src/components/project/ExportModal.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportProject, getExportStatus, downloadExport } from "@/features/projects/api/projects-api";
import type { ExportFormat } from "@/features/projects/types/project-types";
import { useToast } from "@/components/ui/use-toast";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function ExportModal({ open, onOpenChange, projectId }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("single");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const job = await exportProject(projectId, format);
      setJobId(job.job_id);
      setStatus("processing");
      return job;
    },
  });

  const startPolling = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const result = await getExportStatus(projectId, id);
        setProgress(result.progress || 0);
        if (result.status === "completed") {
          setStatus("completed");
          clearInterval(interval);
        } else if (result.status === "failed") {
          setStatus("failed");
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleExport = async () => {
    const result = await exportMutation.mutateAsync();
    startPolling(result.job_id);
  };

  const handleDownload = async () => {
    if (!jobId) return;
    const url = await downloadExport(projectId, jobId);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.wav";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {status === "idle" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Format</p>
              <div className="flex gap-2">
                <Button variant={format === "single" ? "default" : "outline"} onClick={() => setFormat("single")}>
                  Single File
                </Button>
                <Button variant={format === "chapters" ? "default" : "outline"} onClick={() => setFormat("chapters")}>
                  Chapters
                </Button>
                <Button variant={format === "segments" ? "default" : "outline"} onClick={() => setFormat("segments")}>
                  Segments
                </Button>
              </div>
            </div>
          )}
          {status === "processing" && (
            <div>
              <p className="text-sm">Exporting... {progress}%</p>
              <div className="w-full h-2 bg-muted rounded mt-2">
                <div className="h-full bg-primary rounded" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === "completed" && (
            <p className="text-green-500">Export ready!</p>
          )}
          {status === "failed" && (
            <p className="text-red-500">Export failed. Please try again.</p>
          )}
        </div>
        <DialogFooter>
          {status === "idle" && <Button onClick={handleExport}>Export</Button>}
          {status === "completed" && <Button onClick={handleDownload}>Download</Button>}
          {status === "failed" && <Button onClick={handleExport}>Retry</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 10: Add dnd-kit Dependency

**Files:** `frontend/package.json`

---

```bash
cd frontend && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### Task 11: Link to Projects from Studio

**Files:** `frontend/src/app/studio/page.tsx`

---

Add "My Projects" link/button to studio page:

```typescript
// In studio/page.tsx
import Link from "next/link";
// Add link somewhere:
<Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
  My Projects
</Link>
```

---

## Acceptance Verification

After completing all tasks, verify:

- [ ] Backend: All API endpoints return correct status codes
- [ ] Backend: Projects, scenes, segments saved to database
- [ ] Backend: Delete cascades to scenes and segments
- [ ] Frontend: Projects list loads and displays correctly
- [ ] Frontend: Can create/edit/delete projects
- [ ] Frontend: Can add/edit/delete scenes and segments
- [ ] Frontend: Timeline allows drag-drop reordering
- [ ] Frontend: Export produces downloadable audio

---

## Execution Options

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** - Dispatch fresh subagent per task, review between tasks
2. **Inline Execution** - Execute tasks in this session with checkpoints

**Which approach?**