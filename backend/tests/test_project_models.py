import pytest
from app.models.project import Project, Scene, Segment


def test_project_has_name_field():
    project = Project(name="Test Project")
    assert project.name == "Test Project"


def test_project_has_user_relationship():
    from app.models.user import User
    user = User(email="test@test.com", password_hash="hash")
    project = Project(name="Test", user_id=user.id)
    assert project.user_id == user.id
