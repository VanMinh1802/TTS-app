"""Project API routes."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models.project import Project, Scene, Segment
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectExportRequest,
    ProjectExportResponse,
    ProjectExportStatusResponse,
    ProjectListItem,
    ProjectResponse,
    ProjectUpdate,
    SegmentReorderRequest,
    SegmentReorderResponse,
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


def to_segment_response(segment: Segment) -> SegmentResponse:
    """Map segment model to response schema."""
    return SegmentResponse(
        id=segment.id,
        text=segment.text,
        voice_id=segment.voice_id,
        order=segment.order_index,
    )


def to_scene_response(scene: Scene) -> SceneResponse:
    """Map scene model to response schema."""
    ordered_segments = sorted(scene.segments, key=lambda item: item.order_index)
    return SceneResponse(
        id=scene.id,
        name=scene.name,
        order=scene.order_index,
        segments=[to_segment_response(segment) for segment in ordered_segments],
    )


def to_project_response(project: Project) -> ProjectResponse:
    """Map project model to response schema."""
    ordered_scenes = sorted(project.scenes, key=lambda item: item.order_index)
    segment_count = sum(len(scene.segments) for scene in ordered_scenes)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        scenes=[to_scene_response(scene) for scene in ordered_scenes],
        scene_count=len(ordered_scenes),
        segment_count=segment_count,
    )


def to_project_list_item(project: Project) -> ProjectListItem:
    """Map project model to list item schema."""
    segment_count = sum(len(scene.segments) for scene in project.scenes)
    return ProjectListItem(
        id=project.id,
        name=project.name,
        description=project.description,
        scene_count=len(project.scenes),
        segment_count=segment_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Create a project for current user."""
    project = service.create_project(current_user.id, data)
    return to_project_response(project)


@router.get("", response_model=list[ProjectListItem])
def list_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """List projects for current user."""
    projects = service.get_user_projects(current_user.id)
    return [to_project_list_item(project) for project in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Get a single project by id."""
    project = service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return to_project_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Update a project by id."""
    project = service.update_project(project_id, current_user.id, data)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return to_project_response(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Delete a project by id."""
    deleted = service.delete_project(project_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def duplicate_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Duplicate a project."""
    project = service.duplicate_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return to_project_response(project)


@router.post("/{project_id}/scenes", response_model=SceneResponse, status_code=status.HTTP_201_CREATED)
def create_scene(
    project_id: str,
    data: SceneCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Create a scene in a project."""
    scene = service.create_scene(project_id, current_user.id, data)
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return to_scene_response(scene)


@router.put("/{project_id}/scenes/{scene_id}", response_model=SceneResponse)
def update_scene(
    project_id: str,
    scene_id: str,
    data: SceneUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Update scene by id."""
    scene = service.update_scene(scene_id, project_id, current_user.id, data)
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found")
    return to_scene_response(scene)


@router.delete("/{project_id}/scenes/{scene_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scene(
    project_id: str,
    scene_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Delete scene by id."""
    deleted = service.delete_scene(scene_id, project_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found")


@router.post(
    "/{project_id}/scenes/{scene_id}/segments",
    response_model=SegmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_segment(
    project_id: str,
    scene_id: str,
    data: SegmentCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Create segment by scene id."""
    segment = service.create_segment(scene_id, project_id, current_user.id, data)
    if not segment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found")
    return to_segment_response(segment)


@router.put("/{project_id}/segments/{segment_id}", response_model=SegmentResponse)
def update_segment(
    project_id: str,
    segment_id: str,
    data: SegmentUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Update segment by id."""
    segment = service.update_segment(segment_id, project_id, current_user.id, data)
    if not segment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found")
    return to_segment_response(segment)


@router.delete("/{project_id}/segments/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_segment(
    project_id: str,
    segment_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Delete segment by id."""
    deleted = service.delete_segment(segment_id, project_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found")


@router.post("/{project_id}/segments/reorder", response_model=SegmentReorderResponse)
def reorder_segments(
    project_id: str,
    data: SegmentReorderRequest,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Reorder project segments by segment id list."""
    project = service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    updated = service.reorder_segments(project_id, current_user.id, data.scene_id, data.segment_ids)
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid segment reorder")

    return SegmentReorderResponse(success=True)


@router.post(
    "/{project_id}/export",
    response_model=ProjectExportResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_project_export(
    project_id: str,
    data: ProjectExportRequest,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Start asynchronous project export job."""
    job = service.start_export_job(
        project_id=project_id,
        user_id=current_user.id,
        export_format=data.format,
        gap_seconds=data.gap_seconds,
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectExportResponse(job_id=job.id, status=job.status)


@router.get("/{project_id}/export/{job_id}/status", response_model=ProjectExportStatusResponse)
def get_project_export_status(
    project_id: str,
    job_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Get export job status for project owner."""
    job = service.get_export_job(project_id=project_id, user_id=current_user.id, job_id=job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export job not found")

    return ProjectExportStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        error=job.error,
    )


@router.get("/{project_id}/export/{job_id}/download")
def download_project_export(
    project_id: str,
    job_id: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Download generated export output for completed job."""
    job = service.get_export_job(project_id=project_id, user_id=current_user.id, job_id=job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export job not found")

    if job.status != "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Export job is not completed")

    output_bytes = job.output_data
    if not output_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export output not found")

    content_type = job.content_type or "application/octet-stream"
    file_name = job.file_name or f"project_export_{job_id}.bin"
    headers = {"Content-Disposition": f'attachment; filename="{file_name}"'}
    return Response(content=output_bytes, media_type=content_type, headers=headers)
