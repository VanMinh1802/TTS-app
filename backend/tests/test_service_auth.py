"""Tests for auth service."""
from app.core.uow import UnitOfWork
from app.services.auth_service import AuthService
from app.models.user import User

def test_get_current_user(db_session):
    uow = UnitOfWork(db_session)
    service = AuthService(uow)
    user = uow.users.create(User(email="auth@test.com", name="Auth Test"))
    uow.commit()
    from unittest.mock import patch
    with patch("app.services.auth_service.decode_token", return_value={"sub": user.id, "type": "access", "email": user.email}):
        result = service.get_current_user("fake-token")
        assert result.email == "auth@test.com"
