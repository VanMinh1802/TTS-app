"""Quota API routes."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

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


class RecordUsageRequest(BaseModel):
    characters: int = 0
    api_calls: int = 1


@router.post("/record")
def record_usage(
    body: RecordUsageRequest,
    current_user: User = Depends(get_current_user),
    service: QuotaService = Depends(get_quota_service),
):
    if body.api_calls > 0:
        service.consume_quota(current_user.id, "api_calls", body.api_calls)
    if body.characters > 0:
        service.consume_quota(current_user.id, "characters", body.characters)
    return {"status": "ok"}


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