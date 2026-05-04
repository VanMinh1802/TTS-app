import secrets
from typing import List
from datetime import datetime, timedelta
from sqlalchemy import select

from app.core.uow import UnitOfWork
from app.core.exceptions import LicenseError, NotFoundError, PermissionDeniedError
from app.models.user import User
from app.models.license import LicenseKey

class LicenseService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def generate_keys(self, current_user: User, duration_days: int, count: int = 1, tier: str = "pro") -> List[str]:
        if not current_user.is_admin:
            raise PermissionDeniedError("Only admins can generate license keys")

        generated_codes = []

        for _ in range(count):
            random_part = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:8]
            code = f"{tier.upper()}-{duration_days}-{random_part}"

            key = LicenseKey(
                code=code,
                duration_days=duration_days,
                tier=tier,
                created_by_id=current_user.id
            )
            self.uow.licenses.create(key)
            generated_codes.append(code)

        self.uow.commit()
        return generated_codes

    def activate_key(self, current_user: User, code: str) -> bool:
        from app.services.quota_service import QuotaService, QUOTA_LIMITS

        key = self.uow.licenses.get_by_code(code)

        if not key:
            raise NotFoundError("License code not found")

        if key.is_used:
            raise LicenseError("This license code has already been used")

        key.is_used = True
        key.used_by_id = current_user.id
        key.used_at = datetime.utcnow()

        current_user.subscription_tier = key.tier

        now = datetime.utcnow()
        if current_user.subscription_expires_at and current_user.subscription_expires_at > now:
            current_user.subscription_expires_at += timedelta(days=key.duration_days)
        else:
            current_user.subscription_expires_at = now + timedelta(days=key.duration_days)

        quota_service = QuotaService(self.uow)
        quota = quota_service.get_or_create_quota(current_user.id)
        new_limits = QUOTA_LIMITS.get(key.tier, QUOTA_LIMITS["free"])
        quota.tier = key.tier
        quota.characters_limit = new_limits["characters"]
        quota.storage_limit_mb = new_limits["storage_mb"]
        quota.api_calls_limit = new_limits["api_calls"]

        self.uow.commit()
        return True

    def get_all_licenses(self, current_user: User):
        if not current_user.is_admin:
            raise PermissionDeniedError("Only admins can view licenses")

        stmt = select(LicenseKey, User.email).outerjoin(User, LicenseKey.used_by_id == User.id)
        results = self.uow.licenses.session.execute(stmt).all()

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
            raise PermissionDeniedError("Only admins can delete licenses")
        key = self.uow.licenses.get(license_id)
        if not key:
            raise NotFoundError("License not found")
        self.uow.licenses.delete(key)
        self.uow.commit()
