"""Project business logic service and export workers."""
from collections.abc import Callable
import io
import json
import logging
import threading
import wave
from datetime import datetime
from queue import Empty, Queue
from typing import Any, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.core.redis import get_redis_sync
from app.db import SessionLocal
from app.models.project import Project, ProjectExportJob, Scene, Segment
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    SceneCreate,
    SceneUpdate,
    SegmentCreate,
    SegmentUpdate,
)
from app.services.tts_service import tts_service, DEFAULT_VOICE
from app.utils.text_utils import strip_emotion_tags

logger = logging.getLogger(__name__)

EXPORT_JOB_QUEUE_KEY = "project_export_jobs"
EXPORT_WORKER_SLEEP_SECONDS = 0.1

SessionFactory = Callable[[], Session]

_local_export_queue: "Queue[tuple[str, Optional[SessionFactory]]]" = Queue()
_worker_lock = threading.Lock()
_worker_started = False
_export_session_factory_lock = threading.Lock()
_export_session_factory: Optional[SessionFactory] = None


def _serialize_project_payload(project: Project) -> dict[str, Any]:
    """Build detached project payload for background export."""
    ordered_scenes = sorted(project.scenes, key=lambda item: item.order_index)
    scenes: list[dict[str, Any]] = []
    for scene in ordered_scenes:
        ordered_segments = sorted(scene.segments, key=lambda item: item.order_index)
        scenes.append(
            {
                "id": scene.id,
                "name": scene.name,
                "order": scene.order_index,
                "segments": [
                    {
                        "id": segment.id,
                        "text": segment.text,
                        "voice_id": segment.voice_id,
                        "order": segment.order_index,
                    }
                    for segment in ordered_segments
                ],
            }
        )

    return {
        "id": project.id,
        "name": project.name,
        "scenes": scenes,
    }


def _collect_segments_for_export(project_payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Collect segments in scene-order then segment-order."""
    ordered_scenes = sorted(project_payload.get("scenes", []), key=lambda item: item.get("order", 0))
    segments: list[dict[str, Any]] = []
    for scene in ordered_scenes:
        scene_segments = sorted(scene.get("segments", []), key=lambda item: item.get("order", 0))
        segments.extend(scene_segments)
    return segments


def _sanitize_filename(value: str, *, fallback: str) -> str:
    """Sanitize filename component."""
    candidate = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in value.strip())
    candidate = candidate.strip("_")
    return candidate or fallback


def _silent_wav(sample_rate: int, seconds: float) -> bytes:
    """Create silence WAV bytes."""
    duration = max(seconds, 0.0)
    frame_count = int(sample_rate * duration)
    silence = b"\x00\x00" * frame_count
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(silence)
    return buffer.getvalue()


def _extract_wav_frames(wav_bytes: bytes) -> tuple[int, bytes]:
    """Extract sample rate and raw frames from WAV bytes."""
    with wave.open(io.BytesIO(wav_bytes), "rb") as wav_file:
        sample_rate = wav_file.getframerate()
        frames = wav_file.readframes(wav_file.getnframes())
    return sample_rate, frames


def _build_wav(sample_rate: int, frames: bytes) -> bytes:
    """Build WAV bytes from sample rate and frames."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(frames)
    return buffer.getvalue()


def _create_zip(payloads: list[tuple[str, bytes]]) -> bytes:
    """Create zip bytes from named payload list."""
    import zipfile

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for name, content in payloads:
            zip_file.writestr(name, content)
    return buffer.getvalue()


def _render_segment_audio_bytes(segment_payload: dict[str, Any]) -> tuple[int, bytes]:
    """Render one segment and extract WAV frames."""
    raw_text = str(segment_payload.get("text", ""))
    clean_text = strip_emotion_tags(raw_text)
    wav_bytes, _duration = tts_service.synthesize(
        text=clean_text,
        voice_id=str(segment_payload.get("voice_id", "vi_female")),
    )
    return _extract_wav_frames(wav_bytes)


def _render_single_file_export(project_payload: dict[str, Any], gap_seconds: float) -> bytes:
    """Render a merged single WAV output."""
    segments = _collect_segments_for_export(project_payload)
    if not segments:
        raise ValueError("Project has no segments to export")

    output_rate: Optional[int] = None
    output_frames = bytearray()

    for index, segment_payload in enumerate(segments):
        sample_rate, frames = _render_segment_audio_bytes(segment_payload)
        if output_rate is None:
            output_rate = sample_rate

        if output_rate != sample_rate:
            raise ValueError("Sample rate mismatch between generated segments")

        output_frames.extend(frames)

        if index != len(segments) - 1 and gap_seconds > 0:
            gap_rate, gap_frames = _extract_wav_frames(_silent_wav(output_rate, gap_seconds))
            if gap_rate != output_rate:
                raise ValueError("Gap sample rate mismatch")
            output_frames.extend(gap_frames)

    if output_rate is None:
        raise ValueError("Unable to render export output")

    return _build_wav(output_rate, bytes(output_frames))


def _render_chapters_export(project_payload: dict[str, Any], gap_seconds: float) -> bytes:
    """Render a zip with one WAV file per scene."""
    ordered_scenes = sorted(project_payload.get("scenes", []), key=lambda item: item.get("order", 0))
    if not ordered_scenes:
        raise ValueError("Project has no scenes to export")

    payloads: list[tuple[str, bytes]] = []
    for scene_index, scene_payload in enumerate(ordered_scenes, start=1):
        scene_segments = sorted(scene_payload.get("segments", []), key=lambda item: item.get("order", 0))
        if not scene_segments:
            continue

        output_rate: Optional[int] = None
        output_frames = bytearray()
        for index, segment_payload in enumerate(scene_segments):
            sample_rate, frames = _render_segment_audio_bytes(segment_payload)
            if output_rate is None:
                output_rate = sample_rate

            if output_rate != sample_rate:
                raise ValueError("Sample rate mismatch between generated segments")

            output_frames.extend(frames)

            if index != len(scene_segments) - 1 and gap_seconds > 0:
                gap_rate, gap_frames = _extract_wav_frames(_silent_wav(output_rate, gap_seconds))
                if gap_rate != output_rate:
                    raise ValueError("Gap sample rate mismatch")
                output_frames.extend(gap_frames)

        if output_rate is None:
            continue

        safe_name = _sanitize_filename(
            str(scene_payload.get("name", "")).strip(),
            fallback=f"scene_{scene_index:02d}",
        )
        file_name = f"scene_{scene_index:02d}_{safe_name}.wav"
        payloads.append((file_name, _build_wav(output_rate, bytes(output_frames))))

    if not payloads:
        raise ValueError("Project has no segments to export")

    return _create_zip(payloads)


def _render_segments_export(project_payload: dict[str, Any]) -> bytes:
    """Render a zip with one WAV file per segment."""
    segments = _collect_segments_for_export(project_payload)
    if not segments:
        raise ValueError("Project has no segments to export")

    payloads: list[tuple[str, bytes]] = []
    for index, segment_payload in enumerate(segments, start=1):
        text_value = str(segment_payload.get("text", ""))
        voice_id = str(segment_payload.get("voice_id", "vi_female"))
        wav_bytes, _duration = tts_service.synthesize(text=text_value, voice_id=voice_id)
        text_stub = _sanitize_filename(text_value[:24], fallback=f"segment_{index:03d}")
        payloads.append((f"segment_{index:03d}_{text_stub}.wav", wav_bytes))

    return _create_zip(payloads)


def _render_project_export_bytes(project_payload: dict[str, Any], export_format: str, gap_seconds: float) -> tuple[str, bytes]:
    """Render export bytes and content type."""
    if export_format == "single":
        return "audio/wav", _render_single_file_export(project_payload, gap_seconds)

    if export_format == "chapters":
        return "application/zip", _render_chapters_export(project_payload, gap_seconds)

    if export_format == "segments":
        return "application/zip", _render_segments_export(project_payload)

    raise ValueError(f"Unsupported export format: {export_format}")


def _build_download_filename(project_payload: dict[str, Any], export_format: str, content_type: str) -> str:
    """Build download filename for export artifact."""
    base_name = _sanitize_filename(str(project_payload.get("name", "")).strip(), fallback="project_export")
    extension = "wav" if content_type == "audio/wav" else "zip"
    return f"{base_name}_{export_format}.{extension}"


def _build_session_factory_for_bind(bind: Any) -> SessionFactory:
    """Build session factory bound to a SQLAlchemy engine/connection."""
    return sessionmaker(autocommit=False, autoflush=False, bind=bind)


def _set_export_session_factory(session_factory: Optional[SessionFactory]) -> None:
    """Set process-wide default session factory for export worker."""
    global _export_session_factory
    with _export_session_factory_lock:
        _export_session_factory = session_factory


def _get_export_session_factory() -> SessionFactory:
    """Get export worker session factory."""
    with _export_session_factory_lock:
        if _export_session_factory is not None:
            return _export_session_factory
    return SessionLocal


def _open_export_session(session_factory: Optional[SessionFactory] = None) -> Session:
    """Open a DB session for export worker operations."""
    factory = session_factory or _get_export_session_factory()
    return factory()


def _enqueue_export_job(job_id: str, session_factory: Optional[SessionFactory] = None) -> None:
    """Enqueue export job to Redis if available, otherwise local queue."""
    redis_client = get_redis_sync()
    if redis_client:
        try:
            redis_client.rpush(EXPORT_JOB_QUEUE_KEY, job_id)
            return
        except Exception as error:
            logger.warning("Failed to enqueue export job in Redis (%s). Falling back to local queue.", error)

    _local_export_queue.put((job_id, session_factory))


def _dequeue_export_job(block_timeout_seconds: int = 1) -> Optional[tuple[str, Optional[SessionFactory]]]:
    """Dequeue one export job id from Redis or local queue."""
    redis_client = get_redis_sync()
    if redis_client:
        try:
            result = redis_client.blpop(EXPORT_JOB_QUEUE_KEY, timeout=block_timeout_seconds)
            if result:
                _key, job_id = result
                return str(job_id), None
        except Exception as error:
            logger.warning("Failed to dequeue export job from Redis (%s). Falling back to local queue.", error)

    try:
        item = _local_export_queue.get(timeout=EXPORT_WORKER_SLEEP_SECONDS)
        if isinstance(item, tuple):
            job_id, session_factory = item
            return str(job_id), session_factory

        return str(item), None
    except Empty:
        return None


def _update_export_job_record(
    job_id: str,
    *,
    session_factory: Optional[SessionFactory] = None,
    **updates: Any,
) -> Optional[ProjectExportJob]:
    """Update export job database record in a dedicated session."""
    db_session = _open_export_session(session_factory=session_factory)
    try:
        job = db_session.query(ProjectExportJob).filter(ProjectExportJob.id == job_id).first()
        if not job:
            return None

        for field, value in updates.items():
            setattr(job, field, value)

        job.updated_at = datetime.utcnow()
        db_session.commit()
        db_session.refresh(job)
        return job
    except Exception:
        db_session.rollback()
        raise
    finally:
        db_session.close()


def _process_export_job(job_id: str, session_factory: Optional[SessionFactory] = None) -> None:
    """Process a persisted export job from DB."""
    db_session = _open_export_session(session_factory=session_factory)
    try:
        job = db_session.query(ProjectExportJob).filter(ProjectExportJob.id == job_id).first()
        if not job:
            return

        payload_json = job.payload_json
        if not payload_json:
            _update_export_job_record(
                job_id,
                session_factory=session_factory,
                status="failed",
                progress=100,
                error="Export payload is missing",
            )
            return

        project_payload = json.loads(payload_json)
        export_format = job.export_format
        gap_seconds = float(job.gap_seconds)
    finally:
        db_session.close()

    _update_export_job_record(
        job_id,
        session_factory=session_factory,
        status="processing",
        progress=20,
        error=None,
    )

    try:
        content_type, output_bytes = _render_project_export_bytes(project_payload, export_format, gap_seconds)
        _update_export_job_record(job_id, session_factory=session_factory, progress=90)

        file_name = _build_download_filename(project_payload, export_format, content_type)
        _update_export_job_record(
            job_id,
            session_factory=session_factory,
            status="completed",
            progress=100,
            content_type=content_type,
            file_name=file_name,
            output_data=output_bytes,
            error=None,
        )
    except Exception as error:
        _update_export_job_record(
            job_id,
            session_factory=session_factory,
            status="failed",
            progress=100,
            error=str(error),
        )


def _export_worker_loop() -> None:
    """Background worker loop for project export jobs."""
    logger.info("Project export worker started")
    while True:
        job_payload = _dequeue_export_job(block_timeout_seconds=1)
        if not job_payload:
            continue

        job_id, session_factory = job_payload

        try:
            _process_export_job(job_id, session_factory=session_factory)
        except Exception:
            logger.exception("Unexpected export worker failure for job %s", job_id)


def ensure_export_worker_started() -> None:
    """Ensure the in-process export worker thread is running."""
    global _worker_started
    with _worker_lock:
        if _worker_started:
            return

        worker = threading.Thread(target=_export_worker_loop, daemon=True, name="project-export-worker")
        worker.start()
        _worker_started = True


class ProjectService:
    """Service for project CRUD operations."""

    def __init__(self, db: Session):
        self.db = db
        self._worker_session_factory = self._resolve_worker_session_factory()
        _set_export_session_factory(self._worker_session_factory)
        ensure_export_worker_started()

    def _resolve_worker_session_factory(self) -> SessionFactory:
        """Build worker session factory from current service session bind."""
        bind = self.db.get_bind()
        return _build_session_factory_for_bind(bind)

    def _commit_or_raise(self) -> None:
        """Commit transaction and rollback on SQLAlchemy errors."""
        try:
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def _commit_or_false(self) -> bool:
        """Commit transaction and return False on SQLAlchemy errors."""
        try:
            self.db.commit()
            return True
        except SQLAlchemyError:
            self.db.rollback()
            return False

    def _flush_or_raise(self) -> None:
        """Flush transaction and rollback on SQLAlchemy errors."""
        try:
            self.db.flush()
        except SQLAlchemyError:
            self.db.rollback()
            raise

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
        self._commit_or_raise()
        self.db.refresh(project)
        return project

    def get_user_projects(self, user_id: str) -> list[Project]:
        """Get all projects for a user."""
        return (
            self.db.query(Project)
            .filter(Project.user_id == user_id)
            .order_by(Project.updated_at.desc(), Project.created_at.desc(), Project.id.desc())
            .all()
        )

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
        self._commit_or_raise()
        self.db.refresh(project)
        return project

    def delete_project(self, project_id: str, user_id: str) -> bool:
        """Delete a project."""
        project = self.get_project(project_id, user_id)
        if not project:
            return False

        self.db.delete(project)
        return self._commit_or_false()

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
        self._flush_or_raise()

        for scene in original.scenes:
            new_scene = Scene(
                project_id=new_project.id,
                name=scene.name,
                order_index=scene.order_index,
            )
            self.db.add(new_scene)
            self._flush_or_raise()

            for segment in scene.segments:
                new_segment = Segment(
                    scene_id=new_scene.id,
                    text=segment.text,
                    voice_id=segment.voice_id,
                    order_index=segment.order_index,
                )
                self.db.add(new_segment)

        self._commit_or_raise()
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
        self._commit_or_raise()
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
            if field == "order":
                field = "order_index"
            setattr(scene, field, value)

        self._commit_or_raise()
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
        return self._commit_or_false()

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
            voice_id=data.voice_id or DEFAULT_VOICE,
            order_index=max_order + 1,
        )
        self.db.add(segment)
        self._commit_or_raise()
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

        self._commit_or_raise()
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
        return self._commit_or_false()

    def reorder_segments(
        self,
        project_id: str,
        user_id: str,
        scene_id: str,
        segment_ids: list[str],
    ) -> bool:
        """Reorder segments by IDs list within one scene."""
        project = self.get_project(project_id, user_id)
        if not project:
            return False

        scene = next((item for item in project.scenes if item.id == scene_id), None)
        if not scene:
            return False

        scene_segments = list(scene.segments)
        scene_segment_ids = [segment.id for segment in scene_segments]

        if len(segment_ids) != len(set(segment_ids)):
            return False

        if len(segment_ids) != len(scene_segment_ids):
            return False

        if set(segment_ids) != set(scene_segment_ids):
            return False

        segment_by_id = {segment.id: segment for segment in scene_segments}
        for index, seg_id in enumerate(segment_ids):
            segment_by_id[seg_id].order_index = index

        return self._commit_or_false()

    def start_export_job(
        self,
        *,
        project_id: str,
        user_id: str,
        export_format: str,
        gap_seconds: float = 1.0,
    ) -> Optional[ProjectExportJob]:
        """Create persistent export job and enqueue it for worker processing."""
        project = self.get_project(project_id, user_id)
        if not project:
            return None

        project_payload = _serialize_project_payload(project)
        payload_json = json.dumps(project_payload)

        job = ProjectExportJob(
            project_id=project_id,
            user_id=user_id,
            export_format=export_format,
            gap_seconds=gap_seconds,
            status="processing",
            progress=0,
            payload_json=payload_json,
        )
        self.db.add(job)
        self._commit_or_raise()
        self.db.refresh(job)

        _enqueue_export_job(job.id, session_factory=self._worker_session_factory)
        return job

    def get_export_job(
        self,
        *,
        project_id: str,
        user_id: str,
        job_id: str,
    ) -> Optional[ProjectExportJob]:
        """Get export job if it belongs to user and project."""
        return (
            self.db.query(ProjectExportJob)
            .filter(
                ProjectExportJob.id == job_id,
                ProjectExportJob.project_id == project_id,
                ProjectExportJob.user_id == user_id,
            )
            .first()
        )
