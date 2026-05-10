import hashlib
import secrets
from typing import List
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from app.core.uow import UnitOfWork
from app.core.exceptions import LicenseError, NotFoundError, PermissionDeniedError
from app.models.user import User
from app.models.license import LicenseKey


def _hash_code(code: str) -> str:
    """Hash a license code with SHA256 for secure storage and lookup."""
    return hashlib.sha256(code.encode()).hexdigest()


def _display_code(code: str) -> str:
    """Return a masked display version of the code (first 8 + ... + last 4)."""
    if len(code) <= 14:
        return code[:4] + "..." + code[-4:]
    return code[:8] + "..." + code[-4:]


class LicenseService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def generate_keys(self, current_user: User, duration_days: int, count: int = 1, tier: str = "pro") -> List[str]:
        if not current_user.is_admin:
            raise PermissionDeniedError("Only admins can generate license keys")

        generated_codes = []

        for _ in range(count):
            random_part = secrets.token_urlsafe(16)
            code = f"{tier.upper()}-{duration_days}-{random_part}"
            code_hash = _hash_code(code)

            key = LicenseKey(
                code=code,
                code_hash=code_hash,
                duration_days=duration_days,
                tier=tier,
                created_by_id=current_user.id,
            )
            self.uow.licenses.create(key)
            generated_codes.append(code)

        self.uow.commit()
        return generated_codes

    def activate_key(self, current_user: User, code: str, request=None) -> bool:
        from app.services.quota_service import QuotaService, QUOTA_LIMITS
        from app.models.activation_log import ActivationLog
        import logging
        logger = logging.getLogger(__name__)

        if request:
            from app.services.rate_limiter import check_activation_rate_limit
            if not check_activation_rate_limit(request):
                raise LicenseError("Too many activation attempts. Try again in a minute.")

        clean_code = code.strip()
        code_hash = _hash_code(clean_code)
        logger.info(f"Activation attempt: code_len={len(clean_code)}, hash={code_hash[:16]}...")
        
        all_keys = self.uow.licenses.find_all()
        db_hashes = [k.code_hash[:16] + "..." for k in all_keys[:5]]
        logger.info(f"DB has {len(all_keys)} keys, first 5 hashes: {db_hashes}")
        
        key = self.uow.licenses.find_one(code_hash=code_hash)

        if not key:
            if request:
                self._log_activation(current_user.id, code_hash, False, request)
            raise NotFoundError("License code not found")

        if key.is_used:
            if request:
                self._log_activation(current_user.id, code_hash, False, request)
            raise LicenseError("This license code has already been used")

        key.is_used = True
        key.used_by_id = current_user.id
        key.used_at = datetime.now(timezone.utc)

        current_user.subscription_tier = key.tier

        now = datetime.now(timezone.utc)
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

        if request:
            self._log_activation(current_user.id, code_hash, True, request)

        self.uow.commit()
        return True

    def _log_activation(self, user_id: str, code_hash: str, success: bool, request) -> None:
        from app.models.activation_log import ActivationLog
        ip = request.client.host if request.client else "unknown"
        log = ActivationLog(
            user_id=user_id,
            code_hash=code_hash,
            success=success,
            ip_address=ip,
        )
        self.uow.session.add(log)
        self.uow.flush()

    def get_all_licenses(self, current_user: User):
        if not current_user.is_admin:
            raise PermissionDeniedError("Only admins can view licenses")

        stmt = (
            select(LicenseKey, User.email)
            .outerjoin(User, LicenseKey.used_by_id == User.id)
            .order_by(LicenseKey.created_at.desc())
        )
        results = self.uow.licenses.session.execute(stmt).all()

        response = []
        for key, email in results:
            response.append({
                "id": str(key.id),
                "code": key.code if key.code else "N/A",
                "duration_days": key.duration_days,
                "tier": key.tier,
                "is_used": key.is_used,
                "used_at": key.used_at.isoformat() if key.used_at else None,
                "created_at": key.created_at.isoformat() if key.created_at else None,
                "used_by_email": email,
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
