"""Token blacklist using Redis for logout and refresh rotation with DB persistence fallback."""
import logging
from datetime import datetime, timedelta, timezone
from app.core.redis import redis_sync_client
from app.db import SessionLocal
from app.models.revoked_token import RevokedToken

logger = logging.getLogger(__name__)

def blacklist_access_token(jti: str, ttl: int = 3600) -> None:
    """Blacklist an access token by JWT ID. TTL defaults to 60 min."""
    # 1. Try Redis first (fast)
    if redis_sync_client:
        try:
            redis_sync_client.setex(f"token_bl:{jti}", ttl, "1")
        except Exception as e:
            logger.warning(f"Redis blacklist failed: {e}")

    # 2. Persist in DB as fallback/audit
    db = SessionLocal()
    try:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
        revoked = RevokedToken(jti=jti, expires_at=expires_at)
        db.merge(revoked)
        db.commit()
    except Exception as e:
        logger.error(f"DB blacklist failed for {jti}: {e}")
        db.rollback()
    finally:
        db.close()

def blacklist_refresh_token(jti: str, ttl: int = 604800) -> None:
    """Blacklist a refresh token by JWT ID. TTL defaults to 7 days."""
    if redis_sync_client:
        try:
            redis_sync_client.setex(f"refresh_bl:{jti}", ttl, "1")
        except Exception as e:
            logger.warning(f"Redis refresh blacklist failed: {e}")

    db = SessionLocal()
    try:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
        revoked = RevokedToken(jti=jti, expires_at=expires_at)
        db.merge(revoked)
        db.commit()
    except Exception as e:
        logger.error(f"DB refresh blacklist failed for {jti}: {e}")
        db.rollback()
    finally:
        db.close()

def is_token_blacklisted(jti: str) -> bool:
    """Check if an access token's JTI is blacklisted."""
    # 1. Check Redis first
    if redis_sync_client:
        try:
            if redis_sync_client.exists(f"token_bl:{jti}"):
                return True
        except Exception as e:
            logger.warning(f"Redis check failed: {e}")

    # 2. Fallback to DB
    db = SessionLocal()
    try:
        token = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
        if token:
            now = datetime.now(timezone.utc)
            expires_at = token.expires_at
            # Handle potential SQLite naive datetime
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at > now:
                return True
        return False
    except Exception as e:
        logger.error(f"DB blacklist check failed for {jti}: {e}")
        return False
    finally:
        db.close()

def is_refresh_blacklisted(jti: str) -> bool:
    """Check if a refresh token's JTI is blacklisted."""
    # 1. Check Redis first
    if redis_sync_client:
        try:
            if redis_sync_client.exists(f"refresh_bl:{jti}"):
                return True
        except Exception as e:
            logger.warning(f"Redis refresh check failed: {e}")

    # 2. Fallback to DB
    db = SessionLocal()
    try:
        token = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
        if token:
            now = datetime.now(timezone.utc)
            expires_at = token.expires_at
            # Handle potential SQLite naive datetime
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
                
            if expires_at > now:
                return True
        return False
    except Exception as e:
        logger.error(f"DB refresh blacklist check failed for {jti}: {e}")
        return False
    finally:
        db.close()
