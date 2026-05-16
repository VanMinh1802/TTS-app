"""Quota service for user quota management."""
import logging
from datetime import datetime, date, timezone
from typing import Optional

from app.core.settings import settings
from app.core.uow import UnitOfWork
from app.models.quota import UserQuota, UsageHistory

from app.core.constants import QUOTA_LIMITS

logger = logging.getLogger(__name__)


class QuotaService:
    """Quota management service."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    @staticmethod
    def _is_unlimited(limit: int | None) -> bool:
        return limit is None

    @staticmethod
    def _remaining(used: int, limit: int | None) -> int | None:
        if limit is None:
            return None
        return max(0, limit - used)

    @staticmethod
    def _has_capacity(used: int, limit: int | None, amount: int) -> bool:
        if limit is None:
            return True
        return used + amount <= limit

    def get_or_create_quota(self, user_id: str) -> UserQuota:
        return self.uow.quotas.get_or_create_for_user(user_id)

    def check_quota(self, user_id: str, resource: str, amount: int = 1) -> bool:
        quota = self.get_or_create_quota(user_id)

        if resource == "characters":
            return self._has_capacity(quota.characters_used, quota.characters_limit, amount)
        elif resource == "storage":
            return self._has_capacity(quota.storage_used_mb, quota.storage_limit_mb, amount)
        elif resource == "api_calls":
            return self._has_capacity(quota.api_calls_today, quota.api_calls_limit, amount)
        return False

    def consume_quota(
        self, user_id: str, resource: str, amount: int = 1
    ) -> tuple[bool, Optional[UserQuota]]:
        quota = self.get_or_create_quota(user_id)

        if not self.check_quota(user_id, resource, amount):
            return False, quota

        if resource == "characters":
            quota.characters_used += amount
        elif resource == "storage":
            quota.storage_used_mb += amount
        elif resource == "api_calls":
            quota.api_calls_today += amount

        # Upsert daily usage history
        from datetime import datetime as dt
        today_start = dt.combine(date.today(), dt.min.time())
        existing = self.uow.session.query(UsageHistory).filter(
            UsageHistory.user_id == user_id,
            UsageHistory.date >= today_start
        ).first()
        if existing:
            if resource == "characters":
                existing.characters_used += amount
            elif resource == "api_calls":
                existing.api_calls += amount
            elif resource == "storage":
                existing.storage_mb += amount
        else:
            history = UsageHistory(
                user_id=user_id,
                date=dt.combine(date.today(), dt.min.time()),
                characters_used=amount if resource == "characters" else 0,
                api_calls=amount if resource == "api_calls" else 0,
                storage_mb=amount if resource == "storage" else 0,
            )
            self.uow.session.add(history)

        self.uow.commit()
        return True, quota

    def get_quota_status(self, user_id: str) -> dict:
        quota = self.get_or_create_quota(user_id)
        limits = QUOTA_LIMITS.get(quota.tier, QUOTA_LIMITS["free"])

        return {
            "tier": quota.tier,
            "limits": {
                "characters_per_month": quota.characters_limit,
                "storage_mb": quota.storage_limit_mb,
                "api_calls_per_day": quota.api_calls_limit,
            },
            "usage": {
                "characters_this_month": quota.characters_used,
                "storage_used_mb": quota.storage_used_mb,
                "api_calls_today": quota.api_calls_today,
            },
            "remaining": {
                "characters": self._remaining(quota.characters_used, quota.characters_limit),
                "storage_mb": self._remaining(quota.storage_used_mb, quota.storage_limit_mb),
                "api_calls": self._remaining(quota.api_calls_today, quota.api_calls_limit),
            },
            "reset_at": quota.last_reset_at.isoformat() if quota.last_reset_at else None,
        }

    def reset_daily_quota(self, user_id: str) -> None:
        quota = self.get_or_create_quota(user_id)
        quota.api_calls_today = 0
        quota.last_reset_at = datetime.now(timezone.utc)
        self.uow.commit()

    def get_usage_history(
        self, user_id: str, limit: int = 30
    ) -> list[UsageHistory]:
        return self.uow.usage_history.get_by_user(user_id, limit)
