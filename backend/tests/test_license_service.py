import pytest
from datetime import datetime, timedelta
from app.core.uow import UnitOfWork
from app.core.exceptions import LicenseError, PermissionDeniedError
from app.models.user import User
from app.models.license import LicenseKey
from app.services.license_service import LicenseService

def test_generate_keys(db_session):
    admin_user = User(email="admin@test.com", is_admin=True)
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)

    normal_user = User(email="normal@test.com", is_admin=False)
    db_session.add(normal_user)
    db_session.commit()

    with pytest.raises(PermissionDeniedError, match="Only admins"):
        service.generate_keys(normal_user, duration_days=30, count=2)

    keys = service.generate_keys(admin_user, duration_days=30, count=2, tier="pro")
    assert len(keys) == 2
    assert keys[0].startswith("PRO-30-")

    db_keys = db_session.query(LicenseKey).all()
    assert len(db_keys) == 2

def test_activate_key(db_session):
    admin_user = User(email="admin2@test.com", is_admin=True)
    normal_user = User(email="normal2@test.com", is_admin=False, subscription_tier="free")
    db_session.add_all([admin_user, normal_user])
    db_session.commit()
    db_session.refresh(admin_user)
    db_session.refresh(normal_user)

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    keys = service.generate_keys(admin_user, duration_days=30, count=1, tier="pro")
    code = keys[0]

    result = service.activate_key(normal_user, code)
    assert result is True

    db_session.refresh(normal_user)
    assert normal_user.subscription_tier == "pro"
    assert normal_user.subscription_expires_at is not None

    with pytest.raises(LicenseError, match="used"):
        service.activate_key(normal_user, code)
