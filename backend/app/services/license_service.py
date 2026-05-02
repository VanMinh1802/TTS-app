import secrets
from typing import List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.models.license import LicenseKey

class LicenseService:
    def __init__(self, db: Session):
        self.db = db

    def generate_keys(self, current_user: User, duration_days: int, count: int = 1, tier: str = "pro") -> List[str]:
        """Generate license keys. Only accessible by admins."""
        if not current_user.is_admin:
            raise ValueError("Only admins can generate license keys")
            
        generated_codes = []
        
        for _ in range(count):
            # Format: TIER-DURATION-RANDOM
            random_part = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:8]
            code = f"{tier.upper()}-{duration_days}-{random_part}"
            
            key = LicenseKey(
                code=code,
                duration_days=duration_days,
                tier=tier,
                created_by_id=current_user.id
            )
            self.db.add(key)
            generated_codes.append(code)
            
        self.db.commit()
        return generated_codes

    def activate_key(self, current_user: User, code: str) -> bool:
        """Activate a license key for the given user."""
        from app.services.quota_service import QuotaService, QUOTA_LIMITS
        
        key = self.db.execute(
            select(LicenseKey).where(LicenseKey.code == code)
        ).scalar_one_or_none()
        
        if not key:
            raise ValueError("Invalid license code")
            
        if key.is_used:
            raise ValueError("This license code has already been used")
            
        # Update key
        key.is_used = True
        key.used_by_id = current_user.id
        key.used_at = datetime.utcnow()
        
        # Update user
        current_user.subscription_tier = key.tier
        
        # Extend or set new expiry
        now = datetime.utcnow()
        if current_user.subscription_expires_at and current_user.subscription_expires_at > now:
            current_user.subscription_expires_at += timedelta(days=key.duration_days)
        else:
            current_user.subscription_expires_at = now + timedelta(days=key.duration_days)
        
        # Sync UserQuota table with new tier limits
        quota_service = QuotaService(self.db)
        quota = quota_service.get_or_create_quota(current_user.id)
        new_limits = QUOTA_LIMITS.get(key.tier, QUOTA_LIMITS["free"])
        quota.tier = key.tier
        quota.characters_limit = new_limits["characters"]
        quota.storage_limit_mb = new_limits["storage_mb"]
        quota.api_calls_limit = new_limits["api_calls"]
            
        self.db.commit()
        return True
    
    def get_all_licenses(self, current_user: User):
        """Get all licenses for admin dashboard."""
        if not current_user.is_admin:
            raise ValueError("Only admins can view licenses")
            
        stmt = select(LicenseKey, User.email).outerjoin(User, LicenseKey.used_by_id == User.id)
        results = self.db.execute(stmt).all()
        
        response = []
        for key, email in results:
            response.append({
                "id": str(key.id),
                "code": key.code,
                "duration_days": key.duration_days,
                "tier": key.tier,
                "is_used": key.is_used,
                "used_at": key.used_at,
                "created_at": key.created_at,
                "used_by_email": email
            })
        return response

    def delete_license(self, current_user: User, license_id: str):
        if not current_user.is_admin:
            raise ValueError("Only admins can delete licenses")
        key = self.db.get(LicenseKey, license_id)
        if not key:
            raise ValueError("License not found")
        self.db.delete(key)
        self.db.commit()
