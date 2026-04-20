"""Analytics API endpoints for admin."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.analytics_service import AnalyticsService
from app.api.auth import get_current_user
from app.models.user import User


router = APIRouter(prefix="/admin/analytics", tags=["Analytics"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("")
async def get_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    """Get analytics summary for admin dashboard."""
    service = AnalyticsService(db)
    
    return {
        "total_requests": service.get_total_requests(),
        "total_users": service.get_total_users(),
        "average_latency_ms": service.get_average_latency(),
        "requests_today": service.get_requests_today(),
        "requests_by_endpoint": service.get_requests_by_endpoint(),
        "top_users": service.get_top_users(),
    }