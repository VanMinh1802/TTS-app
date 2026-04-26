import pytest
from datetime import datetime, timedelta
from app.models.user import User
from app.models.license import LicenseKey

def test_user_subscription_expires_at(db_session):
    """Test that User model has subscription_expires_at field."""
    user = User(email="test_license@example.com", name="Test License")
    db_session.add(user)
    db_session.commit()
    
    assert hasattr(user, "subscription_expires_at")
    assert user.subscription_expires_at is None
    
    expiry = datetime.utcnow() + timedelta(days=30)
    user.subscription_expires_at = expiry
    db_session.commit()
    db_session.refresh(user)
    
    assert user.subscription_expires_at is not None
    assert user.subscription_expires_at.date() == expiry.date()

def test_license_key_creation(db_session):
    """Test creating a LicenseKey record."""
    user = User(email="admin_creator@example.com", name="Admin", is_admin=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    key = LicenseKey(
        code="PRO-1M-TEST1234",
        duration_days=30,
        tier="pro",
        created_by_id=user.id
    )
    db_session.add(key)
    db_session.commit()
    db_session.refresh(key)
    
    assert key.id is not None
    assert key.code == "PRO-1M-TEST1234"
    assert key.is_used is False
    assert key.duration_days == 30
    assert key.used_by_id is None
