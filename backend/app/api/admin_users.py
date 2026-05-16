"""Admin Users API endpoints."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth import get_current_user
from app.core.di import get_uow
from app.core.uow import UnitOfWork
from app.models.user import User


router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


class UserAdminResponse(BaseModel):
    id: str
    email: str
    name: str
    subscription_tier: str
    subscription_expires_at: Optional[datetime]
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserAdminListResponse(BaseModel):
    items: List[UserAdminResponse]
    total: int
    page: int
    per_page: int


class UpdateUserTierRequest(BaseModel):
    tier: str
    duration_days: Optional[int] = None


@router.get("", response_model=UserAdminListResponse)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None, min_length=2),
    admin: User = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
):
    """List all users with pagination and optional search."""
    query = uow.session.query(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) | (User.name.ilike(search_term))
        )
        
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return UserAdminListResponse(
        items=users,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    admin: User = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
):
    """Toggle user active status (block/unblock)."""
    user = uow.users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        
    user.is_active = not user.is_active
    new_status = user.is_active
    uow.commit()
    
    return {"status": "success", "is_active": new_status}


@router.post("/{user_id}/tier")
def update_user_tier(
    user_id: str,
    request: UpdateUserTierRequest,
    admin: User = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
):
    """Manually upgrade or downgrade user tier."""
    from datetime import timedelta, timezone
    
    user = uow.users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.subscription_tier = request.tier
    
    if request.duration_days:
        user.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=request.duration_days)
    elif request.tier == "free":
        user.subscription_expires_at = None
        
    # Also update quota tier
    from app.services.quota_service import QuotaService
    quota_svc = QuotaService(uow)
    quota = quota_svc.get_or_create_quota(user.id)
    quota.tier = request.tier
    # Set proper limits based on the new tier
    limits = quota_svc.QUOTA_LIMITS.get(request.tier, quota_svc.QUOTA_LIMITS["free"])
    quota.characters_limit = limits["characters"]
    quota.storage_limit_mb = limits["storage_mb"]
    quota.api_calls_limit = limits["api_calls"]
    
    new_tier = user.subscription_tier
    uow.commit()
    
    return {"status": "success", "tier": new_tier}
