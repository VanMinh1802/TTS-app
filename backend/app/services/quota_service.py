"""Quota service for user quota management."""
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.models.quota import UserQuota, UsageHistory

logger = logging.getLogger(__name__)

QUOTA_LIMITS = {
    "free": {"characters": 5000, "storage_mb": 100, "api_calls": 100},
    "basic": {"characters": 50000, "storage_mb": 1024, "api_calls": 1000},
    "pro": {"characters": 200000, "storage_mb": 5120, "api_calls": 5000},
    "enterprise": {
        "characters": None,
        "storage_mb": 51200,
        "api_calls": None,
    },
}


class QuotaService:
    """Quota management service."""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_quota(self, user_id: str) -> UserQuota:
        """Get or create quota for user."""
        quota = self.db.execute(
            select(UserQuota).where(UserQuota.user_id == user_id)
        ).scalar_one_or_none()

        if not quota:
            limits = QUOTA_LIMITS[settings.DEFAULT_QUOTA_TIER]
            quota = UserQuota(
                user_id=user_id,
                tier=settings.DEFAULT_QUOTA_TIER,
                characters_limit=limits["characters"],
                storage_limit_mb=limits["storage_mb"],
                api_calls_limit=limits["api_calls"],
            )
            self.db.add(quota)
            self.db.commit()
            self.db.refresh(quota)

        return quota

    def check_quota(self, user_id: str, resource: str, amount: int = 1) -> bool:
        """Check if user has quota for resource."""
        quota = self.get_or_create_quota(user_id)

        if resource == "characters":
            return quota.characters_used + amount <= quota.characters_limit
        elif resource == "storage":
            return quota.storage_used_mb + amount <= quota.storage_limit_mb
        elif resource == "api_calls":
            return quota.api_calls_today + amount <= quota.api_calls_limit
        return False

    def consume_quota(
        self, user_id: str, resource: str, amount: int = 1
    ) -> tuple[bool, Optional[UserQuota]]:
        """Consume quota for resource. Returns (success, quota)."""
        quota = self.get_or_create_quota(user_id)

        if not self.check_quota(user_id, resource, amount):
            return False, quota

        if resource == "characters":
            quota.characters_used += amount
        elif resource == "storage":
            quota.storage_used_mb += amount
        elif resource == "api_calls":
            quota.api_calls_today += amount

        self.db.commit()
        self.db.refresh(quota)
        return True, quota

    def get_remaining(self, quota: UserQuota) -> dict:
        """Get remaining quota."""
        return {
            "characters": max(0, quota.characters_limit - quota.characters_used),
            "storage_mb": max(0, quota.storage_limit_mb - quota.storage_used_mb),
            "api_calls": max(0, quota.api_calls_limit - quota.api_calls_today),
        }

    def get_quota_status(self, user_id: str) -> dict:
        """Get full quota status for user."""
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
            "remaining": self.get_remaining(quota),
            "reset_at": quota.last_reset_at.isoformat() if quota.last_reset_at else None,
        }

    def reset_daily_quota(self, user_id: str) -> None:
        """Reset daily quota counters."""
        quota = self.get_or_create_quota(user_id)
        quota.api_calls_today = 0
        quota.last_reset_at = datetime.utcnow()
        self.db.commit()

    def get_usage_history(
        self, user_id: str, limit: int = 30
    ) -> list[UsageHistory]:
        """Get usage history for user."""
        return self.db.execute(
            select(UsageHistory)
            .where(UsageHistory.user_id == user_id)
            .order_by(UsageHistory.date.desc())
            .limit(limit)
        ).scalars().all()