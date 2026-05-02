from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models.user import User
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
    db: Session = Depends(get_db)
):
    service = LicenseService(db)
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
    db: Session = Depends(get_db)
):
    service = LicenseService(db)
    try:
        return service.get_all_licenses(current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/admin/licenses/{license_id}")
def delete_license(
    license_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    service = LicenseService(db)
    try:
        service.delete_license(current_user, license_id)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/subscriptions/activate")
def activate_subscription(
    request: LicenseActivateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LicenseService(db)
    try:
        service.activate_key(current_user, request.code)
        return {
            "success": True, 
            "tier": current_user.subscription_tier, 
            "message": "Subscription activated successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
