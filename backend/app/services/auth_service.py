"""Authentication service."""
import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional

from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.settings import settings
from app.models.user import APIKey, User
from app.schemas.auth import APIKeyCreate, TokenResponse

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service."""

    def __init__(self, db: Session):
        self.db = db

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
            except ValueError:
                pass  # Not a valid ID token, try access token
        
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
                    return {
                        "email": userinfo.get("email"),
                        "name": userinfo.get("name", ""),
                        "picture": userinfo.get("picture"),
                    }
                else:
                    logger.error(f"Userinfo API failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Access token verification failed: {e}")
        
        raise ValueError("Invalid Google credentials - could not verify token")

    async def google_login(self, credential: str) -> TokenResponse:
        """Login or register via Google token."""
        idinfo = await self.verify_google_token(credential)
        
        email = idinfo.get("email")
        if not email:
            raise ValueError("Google token did not contain an email")
            
        name = idinfo.get("name", "")

        user = self.db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

        if not user:
            user = User(
                email=email,
                name=name,
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        
        if not user.is_active:
            raise ValueError("Account is inactive")

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
            raise ValueError("Invalid or expired token")

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        user = self.db.get(User, payload.get("sub"))
        if not user:
            raise ValueError("User not found")

        if not user.is_active:
            raise ValueError("User is inactive")

        return user

    def create_api_key(self, user: User, key_data: APIKeyCreate) -> tuple[APIKey, str]:
        """Create a new API key for user."""
        import secrets
        from app.core.security import pwd_context
        
        # We need the ID first, so we'll create the object, then generate the key
        import uuid
        key_id = str(uuid.uuid4())
        
        # Generate random key: format is gva_{key_id}.{random_secret}
        secret_bytes = secrets.token_urlsafe(32)
        full_key = f"gva_{key_id}.{secret_bytes}"
        key_hash = pwd_context.hash(full_key)

        expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)

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
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)

        return api_key, full_key

    def list_api_keys(self, user: User) -> list[APIKey]:
        """List active API keys for user."""
        return self.db.execute(
            select(APIKey)
            .where(APIKey.user_id == user.id, APIKey.is_active == True)
            .order_by(APIKey.created_at.desc())
        ).scalars().all()

    def revoke_api_key(self, user: User, key_id: str) -> bool:
        """Revoke an API key."""
        api_key = self.db.execute(
            select(APIKey).where(
                APIKey.id == key_id,
                APIKey.user_id == user.id
            )
        ).scalar_one_or_none()

        if not api_key:
            raise ValueError("API key not found")

        api_key.is_active = False
        self.db.commit()
        return True

    def validate_api_key(self, api_key: str) -> Optional[User]:
        """Validate an API key and return the user in O(1) time."""
        from app.core.security import verify_password
        
        if not api_key.startswith("gva_"):
            return None
            
        # Parse the key format: gva_{key_id}.{secret}
        parts = api_key[4:].split(".", 1)
        if len(parts) != 2:
            return None
            
        key_id = parts[0]
        
        # Look up directly by ID instead of scanning entire table
        key = self.db.get(APIKey, key_id)
        
        if not key or not key.is_active:
            return None
            
        if key.expires_at and key.expires_at < datetime.utcnow():
            return None

        if verify_password(api_key, key.key_hash):
            key.total_requests += 1
            key.last_used_at = datetime.utcnow()
            self.db.commit()
            return self.db.get(User, key.user_id)

        return None