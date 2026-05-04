"""Tests for quota repository."""
from app.repositories.quota import QuotaRepository


def test_get_or_create_for_user(db_session):
    repo = QuotaRepository(db_session)
    quota = repo.get_or_create_for_user("test-user")
    assert quota.user_id == "test-user"
    assert repo.get_or_create_for_user("test-user").id == quota.id
