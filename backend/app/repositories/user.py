"""User and API key repository."""
from typing import Optional
from app.repositories.base import BaseRepository
from app.models.user import User, APIKey


class UserRepository(BaseRepository[User]):
    def __init__(self, session):
        super().__init__(User, session)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.find_one(email=email)


class APIKeyRepository(BaseRepository[APIKey]):
    def __init__(self, session):
        super().__init__(APIKey, session)

    def get_active_key(self, key_id: str) -> Optional[APIKey]:
        key = self.get(key_id)
        if key and key.is_active:
            return key
        return None

    def list_by_user(self, user_id: str, page: int = 1, per_page: int = 50) -> tuple[list[APIKey], int]:
        return self.paginate(page=page, per_page=per_page, user_id=user_id, is_active=True)
