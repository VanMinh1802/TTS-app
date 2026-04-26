"""Pydantic schemas for quota API."""
from pydantic import BaseModel

QuotaLimit = int | None


class QuotaLimits(BaseModel):
    """Quota limits."""

    characters_per_month: QuotaLimit
    storage_mb: QuotaLimit
    api_calls_per_day: QuotaLimit


class QuotaUsage(BaseModel):
    """Current usage."""

    characters_this_month: int
    storage_used_mb: int
    api_calls_today: int


class QuotaRemaining(BaseModel):
    """Remaining quota."""

    characters: QuotaLimit
    storage_mb: QuotaLimit
    api_calls: QuotaLimit


class QuotaStatusResponse(BaseModel):
    """Response for quota status endpoint."""

    tier: str
    limits: QuotaLimits
    usage: QuotaUsage
    remaining: QuotaRemaining
    reset_at: str | None


class UsageHistoryItem(BaseModel):
    """Usage history item."""

    date: str
    characters_used: int
    api_calls: int
    storage_mb: int


class UsageHistoryResponse(BaseModel):
    """Response for usage history endpoint."""

    history: list[UsageHistoryItem]
