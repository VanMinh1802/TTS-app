"""Tests for dictionary API routes."""

from app.api.auth import get_current_user
from app.main import app
from app.models.user import User


def create_user(db_session, email: str = "dictionary-api@example.com") -> User:
    user = User(email=email, name="Dictionary API User", password_hash=None)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_dictionary_api_crud_persists_entries(client, db_session):
    user = create_user(db_session)
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        create_response = client.post(
            "/api/dictionary",
            json={"word": "TTS", "pronunciation": "ti ti xi"},
        )
        assert create_response.status_code == 201
        entry = create_response.json()
        assert entry["word"] == "TTS"

        list_response = client.get("/api/dictionary")
        assert list_response.status_code == 200
        assert list_response.json()["total"] == 1

        update_response = client.put(
            f"/api/dictionary/{entry['id']}",
            json={"pronunciation": "ti-ti-xi"},
        )
        assert update_response.status_code == 200

        delete_response = client.delete(f"/api/dictionary/{entry['id']}")
        assert delete_response.status_code == 204

        final_list = client.get("/api/dictionary")
        assert final_list.json()["total"] == 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)
