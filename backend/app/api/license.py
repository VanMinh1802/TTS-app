from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.auth import get_current_user
from app.core.di import get_license_service, get_uow
from app.core.exceptions import LicenseError, NotFoundError
from app.core.uow import UnitOfWork
from app.models.user import User
from app.models.activation_log import ActivationLog
from app.schemas.license import LicenseGenerateRequest, LicenseActivateRequest, LicenseResponse
from app.services.license_service import LicenseService

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this endpoint"
        )
    return current_user

@router.post("/admin/licenses/generate", response_model=List[str])
def generate_licenses(
    request: LicenseGenerateRequest,
    current_user: User = Depends(get_admin_user),
    service: LicenseService = Depends(get_license_service),
):
    try:
        keys = service.generate_keys(
            current_user=current_user,
            duration_days=request.duration_days,
            count=request.count,
            tier=request.tier
        )
        return keys
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/admin/licenses", response_model=List[LicenseResponse])
def get_all_licenses(
    current_user: User = Depends(get_admin_user),
    service: LicenseService = Depends(get_license_service),
):
    try:
        return service.get_all_licenses(current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/admin/licenses/{license_id}")
def delete_license(
    license_id: str,
    current_user: User = Depends(get_admin_user),
    service: LicenseService = Depends(get_license_service),
):
    try:
        service.delete_license(current_user, license_id)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/admin/activation-logs")
def get_activation_logs(
    limit: int = 100,
    success_only: bool = False,
    current_user: User = Depends(get_admin_user),
    uow: UnitOfWork = Depends(get_uow),
):
    query = uow.session.query(ActivationLog).order_by(ActivationLog.created_at.desc())
    if success_only:
        query = query.filter(ActivationLog.success == True)
    logs = query.limit(min(limit, 500)).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "code_hash": log.code_hash[:12] + "...",
            "success": log.success,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]

@router.post("/subscriptions/activate")
def activate_subscription(
    activate_request: LicenseActivateRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    service: LicenseService = Depends(get_license_service),
):
    try:
        service.activate_key(current_user, activate_request.code, request=http_request)
        return {
            "success": True, 
            "tier": current_user.subscription_tier, 
            "message": "Subscription activated successfully"
        }
    except LicenseError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
