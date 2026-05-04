"""License key repository."""
from typing import Optional
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.license import LicenseKey


class LicenseKeyRepository(BaseRepository[LicenseKey]):
    def __init__(self, session):
        super().__init__(LicenseKey, session)

    def get_by_code(self, code: str) -> Optional[LicenseKey]:
        return self.find_one(code=code)

    def get_latest_used_by_user(self, user_id: str) -> Optional[LicenseKey]:
        return self.session.execute(
            select(LicenseKey)
            .where(LicenseKey.used_by_id == user_id, LicenseKey.is_used == True)
            .order_by(LicenseKey.used_at.desc())
            .limit(1)
        ).scalar_one_or_none()

    def get_all_paginated(self, page: int = 1, per_page: int = 50) -> tuple[list[LicenseKey], int]:
        return self.paginate(page=page, per_page=per_page, order_by=LicenseKey.created_at.desc())
