import pytest
from app.models.project import ProjectExportJob
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    SceneCreate,
    SceneUpdate,
    SegmentCreate,
    SegmentUpdate,
)
from app.services.project_service import ProjectService


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_create_project(db_session):
    user = User(email="test@example.com", password_hash="hashed", name="Tester")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    service = ProjectService(db_session)
    project = service.create_project(
        user_id=user.id,
        data=ProjectCreate(name="Test Project", description=None),
    )

    assert project.name == "Test Project"
    assert project.user_id == user.id


@pytest.fixture(scope="function")
def users(db_session):
    owner = User(email="owner@example.com", password_hash="hashed", name="Owner")
    other = User(email="other@example.com", password_hash="hashed", name="Other")
    db_session.add_all([owner, other])
    db_session.commit()
    db_session.refresh(owner)
    db_session.refresh(other)
    return owner, other


def test_project_ownership_scoping_get_update_delete(db_session, users):
    owner, other = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Owned", description="d"))

    assert service.get_project(project.id, other.id) is None

    updated = service.update_project(
        project.id,
        other.id,
        ProjectUpdate(name="Should Not Update"),
    )
    assert updated is None
    owner_view = service.get_project(project.id, owner.id)
    assert owner_view is not None
    assert owner_view.name == "Owned"

    deleted = service.delete_project(project.id, other.id)
    assert deleted is False
    assert service.get_project(project.id, owner.id) is not None


def test_get_user_projects_returns_only_owner_projects(db_session, users):
    owner, other = users
    service = ProjectService(db_session)

    owner_project_1 = service.create_project(owner.id, ProjectCreate(name="Owner A", description=None))
    owner_project_2 = service.create_project(owner.id, ProjectCreate(name="Owner B", description=None))
    other_project = service.create_project(other.id, ProjectCreate(name="Other", description=None))

    projects = service.get_user_projects(owner.id)

    project_ids = {project.id for project in projects}
    assert project_ids == {owner_project_1.id, owner_project_2.id}
    assert other_project.id not in project_ids
    assert all(project.user_id == owner.id for project in projects)


def test_duplicate_project_copies_scenes_and_segments(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    source = service.create_project(owner.id, ProjectCreate(name="Source", description="desc"))
    scene1 = service.create_scene(source.id, owner.id, SceneCreate(name="Scene 1"))
    scene2 = service.create_scene(source.id, owner.id, SceneCreate(name="Scene 2"))
    assert scene1 is not None
    assert scene2 is not None

    seg11 = service.create_segment(
        scene1.id,
        source.id,
        owner.id,
        SegmentCreate(text="line 1", voice_id="v1"),
    )
    seg12 = service.create_segment(
        scene1.id,
        source.id,
        owner.id,
        SegmentCreate(text="line 2", voice_id="v2"),
    )
    seg21 = service.create_segment(
        scene2.id,
        source.id,
        owner.id,
        SegmentCreate(text="line 3", voice_id="v3"),
    )
    assert seg11 is not None
    assert seg12 is not None
    assert seg21 is not None

    duplicated = service.duplicate_project(source.id, owner.id)

    assert duplicated is not None
    assert duplicated.id != source.id
    assert duplicated.name == "Source (copy)"
    assert duplicated.description == source.description
    assert len(duplicated.scenes) == 2
    assert sum(len(s.segments) for s in duplicated.scenes) == 3

    duplicated_scene_names = sorted(s.name for s in duplicated.scenes)
    assert duplicated_scene_names == ["Scene 1", "Scene 2"]
    duplicated_segment_texts = sorted(seg.text for s in duplicated.scenes for seg in s.segments)
    assert duplicated_segment_texts == ["line 1", "line 2", "line 3"]


def test_duplicate_project_returns_none_for_non_owner_or_missing_project(db_session, users):
    owner, other = users
    service = ProjectService(db_session)
    source = service.create_project(owner.id, ProjectCreate(name="Source", description="desc"))

    duplicated_by_other = service.duplicate_project(source.id, other.id)
    duplicated_missing = service.duplicate_project("missing-project-id", owner.id)

    assert duplicated_by_other is None
    assert duplicated_missing is None


def test_create_project_requires_name(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)

    with pytest.raises(ValueError, match="Project name is required"):
        service.create_project(owner.id)


def test_scene_crud_operations(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Scenes", description=None))

    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Opening"))
    assert scene is not None
    assert scene.name == "Opening"
    assert scene.order_index == 0

    updated_scene = service.update_scene(
        scene.id,
        project.id,
        owner.id,
        SceneUpdate(name="Opening Updated", order=3),
    )
    assert updated_scene is not None
    assert updated_scene.name == "Opening Updated"
    assert updated_scene.order_index == 3

    deleted = service.delete_scene(scene.id, project.id, owner.id)
    assert deleted is True
    refreshed_project = service.get_project(project.id, owner.id)
    assert refreshed_project is not None
    assert len(refreshed_project.scenes) == 0


def test_segment_crud_operations(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Segments", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Body"))
    assert scene is not None

    segment = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="hello", voice_id="voice-a"),
    )
    assert segment is not None
    assert segment.text == "hello"
    assert segment.voice_id == "voice-a"
    assert segment.order_index == 0

    updated_segment = service.update_segment(
        segment.id,
        project.id,
        owner.id,
        SegmentUpdate(text="updated", voice_id="voice-b", order=4),
    )
    assert updated_segment is not None
    assert updated_segment.text == "updated"
    assert updated_segment.voice_id == "voice-b"
    assert updated_segment.order_index == 4

    deleted = service.delete_segment(segment.id, project.id, owner.id)
    assert deleted is True
    refreshed_project = service.get_project(project.id, owner.id)
    assert refreshed_project is not None
    assert len(refreshed_project.scenes) == 1
    assert len(refreshed_project.scenes[0].segments) == 0


def test_reorder_segments_updates_order_index(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Reorder", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Only Scene"))
    assert scene is not None

    seg1 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="one", voice_id="v1"),
    )
    seg2 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="two", voice_id="v2"),
    )
    seg3 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="three", voice_id="v3"),
    )
    assert seg1 is not None
    assert seg2 is not None
    assert seg3 is not None

    reordered = service.reorder_segments(
        project.id,
        owner.id,
        scene.id,
        [seg3.id, seg1.id, seg2.id],
    )
    assert reordered is True

    refreshed_project = service.get_project(project.id, owner.id)
    assert refreshed_project is not None
    by_id = {seg.id: seg.order_index for s in refreshed_project.scenes for seg in s.segments}
    assert by_id[seg3.id] == 0
    assert by_id[seg1.id] == 1
    assert by_id[seg2.id] == 2


def test_reorder_segments_scoped_to_scene_only_updates_that_scene(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)

    project = service.create_project(owner.id, ProjectCreate(name="Multi Scene Reorder", description=None))
    scene_a = service.create_scene(project.id, owner.id, SceneCreate(name="Scene A"))
    scene_b = service.create_scene(project.id, owner.id, SceneCreate(name="Scene B"))
    assert scene_a is not None
    assert scene_b is not None

    a1 = service.create_segment(
        scene_a.id,
        project.id,
        owner.id,
        SegmentCreate(text="A1", voice_id="v1"),
    )
    a2 = service.create_segment(
        scene_a.id,
        project.id,
        owner.id,
        SegmentCreate(text="A2", voice_id="v1"),
    )
    b1 = service.create_segment(
        scene_b.id,
        project.id,
        owner.id,
        SegmentCreate(text="B1", voice_id="v2"),
    )

    assert a1 is not None
    assert a2 is not None
    assert b1 is not None

    result = service.reorder_segments(project.id, owner.id, scene_a.id, [a2.id, a1.id])
    assert result is True

    refreshed_project = service.get_project(project.id, owner.id)
    assert refreshed_project is not None

    refreshed_scene_a = next(scene for scene in refreshed_project.scenes if scene.id == scene_a.id)
    refreshed_scene_b = next(scene for scene in refreshed_project.scenes if scene.id == scene_b.id)

    scene_a_order = {segment.id: segment.order_index for segment in refreshed_scene_a.segments}
    scene_b_order = {segment.id: segment.order_index for segment in refreshed_scene_b.segments}

    assert scene_a_order[a2.id] == 0
    assert scene_a_order[a1.id] == 1
    assert scene_b_order[b1.id] == 0


def test_reorder_segments_rejects_duplicate_ids_and_preserves_order(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Reorder Invalid", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Only Scene"))
    assert scene is not None

    seg1 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="one", voice_id="v1"),
    )
    seg2 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="two", voice_id="v2"),
    )
    seg3 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="three", voice_id="v3"),
    )
    assert seg1 is not None
    assert seg2 is not None
    assert seg3 is not None

    before_project = service.get_project(project.id, owner.id)
    assert before_project is not None
    before_by_id = {seg.id: seg.order_index for s in before_project.scenes for seg in s.segments}

    reordered = service.reorder_segments(
        project.id,
        owner.id,
        scene.id,
        [seg1.id, seg1.id, seg3.id],
    )
    assert reordered is False

    after_project = service.get_project(project.id, owner.id)
    assert after_project is not None
    after_by_id = {seg.id: seg.order_index for s in after_project.scenes for seg in s.segments}
    assert after_by_id == before_by_id


def test_reorder_segments_rejects_unknown_or_missing_ids(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Reorder Invalid", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Only Scene"))
    assert scene is not None

    seg1 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="one", voice_id="v1"),
    )
    seg2 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="two", voice_id="v2"),
    )
    assert seg1 is not None
    assert seg2 is not None

    missing_id_order = service.reorder_segments(project.id, owner.id, scene.id, [seg2.id])
    assert missing_id_order is False

    unknown_id_order = service.reorder_segments(
        project.id,
        owner.id,
        scene.id,
        [seg1.id, "unknown-id"],
    )
    assert unknown_id_order is False


def test_reorder_segments_returns_false_for_unknown_scene(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Reorder Missing Scene", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Only Scene"))
    assert scene is not None

    seg1 = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="one", voice_id="v1"),
    )
    assert seg1 is not None

    reordered = service.reorder_segments(project.id, owner.id, "missing-scene-id", [seg1.id])
    assert reordered is False


def test_scene_and_segment_operations_enforce_ownership(db_session, users):
    owner, other = users
    service = ProjectService(db_session)
    project = service.create_project(owner.id, ProjectCreate(name="Ownership", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Scene"))
    assert scene is not None
    segment = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="line", voice_id="v1"),
    )
    assert segment is not None

    assert service.update_scene(
        scene.id,
        project.id,
        other.id,
        SceneUpdate(name="Other Update"),
    ) is None
    assert service.delete_scene(scene.id, project.id, other.id) is False

    assert service.update_segment(
        segment.id,
        project.id,
        other.id,
        SegmentUpdate(text="Other Update"),
    ) is None
    assert service.delete_segment(segment.id, project.id, other.id) is False

    owner_project = service.get_project(project.id, owner.id)
    assert owner_project is not None
    assert len(owner_project.scenes) == 1
    assert owner_project.scenes[0].name == "Scene"
    assert len(owner_project.scenes[0].segments) == 1
    assert owner_project.scenes[0].segments[0].text == "line"


def test_start_export_job_persists_job_and_payload(db_session, users):
    owner, _ = users
    service = ProjectService(db_session)

    project = service.create_project(owner.id, ProjectCreate(name="Export Persist", description=None))
    scene = service.create_scene(project.id, owner.id, SceneCreate(name="Scene 1"))
    assert scene is not None

    segment = service.create_segment(
        scene.id,
        project.id,
        owner.id,
        SegmentCreate(text="Hello export", voice_id="vi_female"),
    )
    assert segment is not None

    job = service.start_export_job(
        project_id=project.id,
        user_id=owner.id,
        export_format="single",
        gap_seconds=1.5,
    )
    assert job is not None
    assert job.project_id == project.id
    assert job.user_id == owner.id
    assert job.export_format == "single"
    assert job.status == "processing"
    assert job.progress == 0
    assert job.payload_json is not None

    persisted = (
        db_session.query(ProjectExportJob)
        .filter(ProjectExportJob.id == job.id)
        .first()
    )
    assert persisted is not None
    assert persisted.payload_json is not None


def test_get_export_job_scopes_by_project_and_user(db_session, users):
    owner, other = users
    service = ProjectService(db_session)

    owner_project = service.create_project(owner.id, ProjectCreate(name="Owner Project", description=None))
    other_project = service.create_project(other.id, ProjectCreate(name="Other Project", description=None))

    owner_scene = service.create_scene(owner_project.id, owner.id, SceneCreate(name="Scene 1"))
    assert owner_scene is not None
    owner_segment = service.create_segment(
        owner_scene.id,
        owner_project.id,
        owner.id,
        SegmentCreate(text="Owner segment", voice_id="vi_female"),
    )
    assert owner_segment is not None

    owner_job = service.start_export_job(
        project_id=owner_project.id,
        user_id=owner.id,
        export_format="single",
    )
    assert owner_job is not None

    assert service.get_export_job(
        project_id=owner_project.id,
        user_id=owner.id,
        job_id=owner_job.id,
    ) is not None

    assert service.get_export_job(
        project_id=owner_project.id,
        user_id=other.id,
        job_id=owner_job.id,
    ) is None

    assert service.get_export_job(
        project_id=other_project.id,
        user_id=owner.id,
        job_id=owner_job.id,
    ) is None
