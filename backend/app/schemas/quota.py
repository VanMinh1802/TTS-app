"""Pydantic schemas for quota API."""
from pydantic import BaseModel


class QuotaLimits(BaseModel):
    """Quota limits."""

    characters_per_month: int
    storage_mb: int
    api_calls_per_day: int


class QuotaUsage(BaseModel):
    """Current usage."""

    characters_this_month: int
    storage_used_mb: int
    api_calls_today: int


class QuotaRemaining(BaseModel):
    """Remaining quota."""

    characters: int
    storage_mb: int
    api_calls: int


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