"""Quota and usage history repository."""
from typing import Optional
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.quota import UserQuota, UsageHistory
from app.core.settings import settings


class QuotaRepository(BaseRepository[UserQuota]):
    QUOTA_LIMITS = {
        "free": {"characters": 5000, "storage_mb": 100, "api_calls": 100},
        "basic": {"characters": 50000, "storage_mb": 1024, "api_calls": 1000},
        "pro": {"characters": 200000, "storage_mb": 5120, "api_calls": 5000},
        "enterprise": {"characters": None, "storage_mb": 51200, "api_calls": None},
    }

    def __init__(self, session):
        super().__init__(UserQuota, session)

    def get_or_create_for_user(self, user_id: str) -> UserQuota:
        quota = self.find_one(user_id=user_id)
        if not quota:
            limits = self.QUOTA_LIMITS.get(settings.DEFAULT_QUOTA_TIER, self.QUOTA_LIMITS["free"])
            quota = UserQuota(
                user_id=user_id,
                tier=settings.DEFAULT_QUOTA_TIER,
                characters_limit=limits["characters"],
                storage_limit_mb=limits["storage_mb"],
                api_calls_limit=limits["api_calls"],
            )
            return self.create(quota)
        return quota

    def get_for_update(self, user_id: str) -> Optional[UserQuota]:
        return self.session.execute(
            select(UserQuota)
            .where(UserQuota.user_id == user_id)
            .with_for_update()
        ).scalar_one_or_none()


class UsageHistoryRepository(BaseRepository[UsageHistory]):
    def __init__(self, session):
        super().__init__(UsageHistory, session)

    def get_by_user(self, user_id: str, limit: int = 30) -> list[UsageHistory]:
        return self.session.execute(
            select(UsageHistory)
            .where(UsageHistory.user_id == user_id)
            .order_by(UsageHistory.date.desc())
            .limit(limit)
        ).scalars().all()
