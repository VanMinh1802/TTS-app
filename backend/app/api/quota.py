"""Quota API routes."""
from fastapi import APIRouter, Depends

from app.api.auth import get_current_user
from app.core.di import get_quota_service
from app.models.user import User
from app.schemas.quota import (
    QuotaStatusResponse,
    UsageHistoryItem,
    UsageHistoryResponse,
)
from app.services.quota_service import QuotaService

router = APIRouter(prefix="/quota", tags=["Quota"])


@router.get("", response_model=QuotaStatusResponse)
def get_quota_status(
    current_user: User = Depends(get_current_user),
    service: QuotaService = Depends(get_quota_service),
):
    """Get current quota status."""
    return service.get_quota_status(current_user.id)


@router.get("/usage", response_model=UsageHistoryResponse)
def get_usage_history(
    current_user: User = Depends(get_current_user),
    service: QuotaService = Depends(get_quota_service),
):
    """Get usage history."""
    history = service.get_usage_history(current_user.id)
    return UsageHistoryResponse(
        history=[
            UsageHistoryItem(
                date=h.date.isoformat(),
                characters_used=h.characters_used,
                api_calls=h.api_calls,
                storage_mb=h.storage_mb,
            )
            for h in history
        ]
    )


@router.post("/reset")
def reset_quota(
    current_user: User = Depends(get_current_user),
    service: QuotaService = Depends(get_quota_service),
):
    """Reset daily quota counters (manual reset)."""
    service.reset_daily_quota(current_user.id)
    return {"status": "success", "message": "Daily quota reset"}