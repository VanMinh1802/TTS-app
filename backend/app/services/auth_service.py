"""Authentication service."""
import logging
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional

from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy import select, func

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.settings import settings
from app.core.uow import UnitOfWork
from app.models.user import APIKey, User
from app.schemas.auth import APIKeyCreate, TokenResponse
from app.core.exceptions import NotFoundError, PermissionDeniedError, InvalidInputError

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    async def verify_google_token(self, credential: str) -> dict:
        """Verify Google token and return user info.
        
        Handles both ID tokens (JWT) and access tokens (Ya29...).
        """
        logger.info(f"Verifying Google token, starts with: {credential[:20] if credential else 'none'}")
        
        # Check if it's an ID token (JWT format with 3 parts)
        if credential.count('.') == 2:
            try:
                idinfo = id_token.verify_oauth2_token(
                    credential, 
                    requests.Request(), 
                    settings.GOOGLE_CLIENT_ID
                )
                logger.info(f"ID token verified for: {idinfo.get('email')}")
                return idinfo
            except ValueError as e:
                logger.debug("Google ID token verification failed, trying as access token: %s", e)
        
        # Try as access token - call Google userinfo API
        logger.info("Trying as access token...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {credential}"},
                    timeout=10.0,
                )
                if response.status_code == 200:
                    userinfo = response.json()
                    logger.info(f"Access token worked for: {userinfo.get('email')}")

                    try:
                        token_info_resp = await client.get(
                            "https://www.googleapis.com/oauth2/v3/tokeninfo",
                            params={"access_token": credential},
                            timeout=5.0,
                        )
                        if token_info_resp.status_code == 200:
                            token_info = token_info_resp.json()
                            if token_info.get("audience") != settings.GOOGLE_CLIENT_ID:
                                logger.warning("Google token audience mismatch: expected %s, got %s",
                                    settings.GOOGLE_CLIENT_ID, token_info.get("audience"))
                    except Exception:
                        logger.debug("Token info check skipped (implicit flow or network issue)")

                    return {
                        "email": userinfo.get("email"),
                        "name": userinfo.get("name", ""),
                        "picture": userinfo.get("picture"),
                    }
                else:
                    logger.error(f"Userinfo API failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Access token verification failed: {e}")
        
        raise PermissionDeniedError("Invalid Google credentials - could not verify token")

    async def google_login(self, credential: str) -> TokenResponse:
        """Login or register via Google token."""
        idinfo = await self.verify_google_token(credential)
        
        email = idinfo.get("email")
        if not email:
            raise InvalidInputError("Google token did not contain an email")
            
        name = idinfo.get("name", "")

        user = self.uow.users.get_by_email(email)

        if not user:
            user = User(
                email=email,
                name=name,
            )
            self.uow.users.create(user)
            self.uow.commit()
        
        if not user.is_active:
            raise PermissionDeniedError("Account is inactive")

        token_data = {"sub": user.id, "email": user.email}
        access_token = create_access_token(token_data)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def get_current_user(self, token: str) -> User:
        """Get current user from token."""
        payload = decode_token(token)
        if not payload:
            raise PermissionDeniedError("Invalid or expired token")

        if payload.get("type") != "access":
            raise PermissionDeniedError("Invalid token type")

        from app.core.token_blacklist import is_token_blacklisted
        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            raise PermissionDeniedError("Token has been revoked")

        user = self.uow.users.get(payload.get("sub"))
        if not user:
            raise NotFoundError("User not found")

        if not user.is_active:
            raise PermissionDeniedError("User is inactive")

        return user

    def create_api_key(self, user: User, key_data: APIKeyCreate) -> tuple[APIKey, str]:
        """Create a new API key for user."""
        import secrets
        from app.core.security import pwd_context
        
        import uuid
        key_id = str(uuid.uuid4())
        
        secret_bytes = secrets.token_urlsafe(32)
        full_key = f"gva_{key_id}.{secret_bytes}"
        key_hash = pwd_context.hash(full_key)

        expires_at = datetime.now(timezone.utc) + timedelta(days=key_data.expires_in_days)

        api_key = APIKey(
            id=key_id,
            user_id=user.id,
            key_hash=key_hash,
            name=key_data.name,
            rate_limit=key_data.rate_limit,
            rate_limit_window=key_data.rate_limit_window,
            expires_at=expires_at,
            scopes=key_data.scopes or "models:read,tts:generate",
        )
        self.uow.api_keys.create(api_key)
        self.uow.commit()

        return api_key, full_key

    def list_api_keys(self, user: User, limit: int = 50, offset: int = 0) -> tuple[list[APIKey], int]:
        """List active API keys for user with pagination."""
        page = (offset // limit) + 1
        return self.uow.api_keys.list_by_user(user.id, page=page, per_page=limit)

    def revoke_api_key(self, user: User, key_id: str) -> bool:
        """Revoke an API key."""
        api_key = self.uow.api_keys.find_one(id=key_id, user_id=user.id)

        if not api_key:
            raise NotFoundError("API key not found")

        api_key.is_active = False
        self.uow.commit()

        from app.core.redis import redis_sync_client
        if redis_sync_client:
            keys = redis_sync_client.keys(f"apikey_auth:{key_id}:*")
            if keys:
                redis_sync_client.delete(*keys)

        return True

    def validate_api_key(self, api_key: str, path: str = "") -> Optional[User]:
        """Validate an API key and return the user in O(1) time."""
        from app.core.security import verify_password
        from app.core.redis import redis_sync_client
        from app.core.scope_map import get_required_scope, has_scope
        import hashlib
        
        if not api_key.startswith("gva_"):
            return None
            
        # Parse the key format: gva_{key_id}.{secret}
        parts = api_key[4:].split(".", 1)
        if len(parts) != 2:
            return None
            
        key_id = parts[0]
        
        # Look up directly by ID instead of scanning entire table
        key = self.uow.api_keys.get_active_key(key_id)
        
        if not key:
            return None
            
        if key.expires_at and key.expires_at < datetime.now(timezone.utc):
            return None

        # Cache bcrypt validation result using SHA256 to avoid 100ms penalty
        hashed_input = hashlib.sha256(api_key.encode()).hexdigest()
        cache_key = f"apikey_auth:{key_id}:{hashed_input}"
        
        is_valid = False
        if redis_sync_client:
            try:
                cached_result = redis_sync_client.get(cache_key)
                if cached_result == "1":
                    is_valid = True
                elif cached_result == "0":
                    return None
            except Exception as e:
                logger.warning(f"Redis cache read error: {e}")

        if not is_valid:
            is_valid = verify_password(api_key, key.key_hash)
            if redis_sync_client:
                try:
                    redis_sync_client.setex(cache_key, 3600, "1" if is_valid else "0")
                except Exception as e:
                    logger.warning(f"Redis cache write error: {e}")

        if is_valid:
            required_scope = get_required_scope(path)
            if required_scope and not has_scope(key.scopes or "models:read,tts:generate", required_scope):
                return None
            key.total_requests += 1
            key.last_used_at = datetime.now(timezone.utc)
            self.uow.commit()
            return self.uow.users.get(key.user_id)
            
        return None
