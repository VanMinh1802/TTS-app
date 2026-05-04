"""Tests for user repository."""
from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.base import BaseRepository


def test_user_repository_crud(db_session):
    repo = UserRepository(db_session)
    user = repo.create(User(email="test@test.com", name="Test User"))
    assert user.id is not None
    assert repo.get(user.id).email == "test@test.com"
    assert repo.get_by_email("test@test.com").id == user.id


def test_user_repository_not_found(db_session):
    repo = UserRepository(db_session)
    assert repo.get("nonexistent") is None
    assert repo.get_by_email("nope@test.com") is None
