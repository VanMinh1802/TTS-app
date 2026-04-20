"""Authentication service."""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_api_key,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import APIKey, User
from app.schemas.auth import (
    APIKeyCreate,
    LoginRequest,
    TokenResponse,
    UserCreate,
)


class AuthService:
    """Authentication service."""

    def __init__(self, db: Session):
        self.db = db

    def register(self, user_data: UserCreate) -> User:
        """Register a new user."""
        # Check if email exists
        existing = self.db.execute(
            select(User).where(User.email == user_data.email)
        ).scalar_one_or_none()
        
        if existing:
            raise ValueError("Email already registered")

        # Create new user
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            name=user_data.name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, login_data: LoginRequest) -> TokenResponse:
        """Login and return tokens."""
        # Find user
        user = self.db.execute(
            select(User).where(User.email == login_data.email)
        ).scalar_one_or_none()

        if not user or not verify_password(
            login_data.password, user.password_hash
        ):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is inactive")

        # Create tokens
        token_data = {"sub": user.id, "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=3600,
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
        from datetime import timedelta
        
        # Generate key
        full_key, key_hash = create_api_key()

        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)

        # Create API key record
        api_key = APIKey(
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
        """Validate an API key and return the user."""
        # Find active API key by hash
        # Note: We need to iterate since we store hash, not the key
        api_keys = self.db.execute(
            select(APIKey).where(APIKey.is_active == True)
        ).scalars().all()

        for key in api_keys:
            if verify_password(api_key, key.key_hash):
                # Update usage stats
                key.total_requests += 1
                key.last_used_at = datetime.utcnow()
                self.db.commit()
                
                # Return associated user
                return self.db.get(User, key.user_id)

        return None

    def get_api_key_usage(self, user: User, key_id: str) -> dict:
        """Get usage stats for an API key."""
        api_key = self.db.execute(
            select(APIKey).where(
                APIKey.id == key_id,
                APIKey.user_id == user.id
            )
        ).scalar_one_or_none()

        if not api_key:
            raise ValueError("API key not found")

        return {
            "key_id": api_key.id,
            "total_requests": api_key.total_requests,
            "successful_requests": api_key.total_requests - api_key.failed_requests,
            "failed_requests": api_key.failed_requests,
            "last_used_at": api_key.last_used_at,
        }

    def record_failed_request(self, api_key_str: str) -> None:
        """Record a failed request for an API key."""
        api_keys = self.db.execute(
            select(APIKey).where(APIKey.is_active == True)
        ).scalars().all()

        for key in api_keys:
            if verify_password(api_key_str, key.key_hash):
                key.failed_requests += 1
                self.db.commit()
                return
