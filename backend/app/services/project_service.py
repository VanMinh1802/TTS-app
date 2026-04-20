"""Project business logic service."""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

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

    def create_project(
        self,
        user_id: str,
        data: Optional[ProjectCreate] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Project:
        """Create a new project."""
        project_name = data.name if data else name
        project_description = data.description if data else description
        if not project_name:
            raise ValueError("Project name is required")

        project = Project(
            user_id=user_id,
            name=project_name,
            description=project_description,
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

    def update_project(
        self,
        project_id: str,
        user_id: str,
        data: ProjectUpdate,
    ) -> Optional[Project]:
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

    def update_scene(
        self,
        scene_id: str,
        project_id: str,
        user_id: str,
        data: SceneUpdate,
    ) -> Optional[Scene]:
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

    def create_segment(
        self,
        scene_id: str,
        project_id: str,
        user_id: str,
        data: SegmentCreate,
    ) -> Optional[Segment]:
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

    def update_segment(
        self,
        segment_id: str,
        project_id: str,
        user_id: str,
        data: SegmentUpdate,
    ) -> Optional[Segment]:
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
