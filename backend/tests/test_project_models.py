import pytest
from app.models.project import Project, ProjectExportJob, Scene, Segment


def test_project_has_name_field():
    project = Project(name="Test Project")
    assert project.name == "Test Project"


def test_project_has_user_relationship():
    from app.models.user import User
    user = User(email="test@test.com", password_hash="hash")
    project = Project(name="Test", user_id=user.id)
    assert project.user_id == user.id


def test_project_export_job_defaults():
    job = ProjectExportJob(project_id="project-1", user_id="user-1", export_format="single")
    assert job.export_format == "single"
    assert job.status in {None, "processing"}
    assert job.progress in {None, 0}
    assert job.output_data is None
