"""Tests for license service error handling using domain exceptions."""
import pytest
from app.core.uow import UnitOfWork
from app.core.exceptions import InvalidInputError, LicenseError, NotFoundError, PermissionDeniedError
from app.models.user import User
from app.services.license_service import LicenseService


def test_activate_nonexistent_code_raises_not_found(db_session):
    admin_user = User(email="admin-exc@test.com", is_admin=True)
    normal_user = User(email="normal-exc@test.com", is_admin=False)
    db_session.add_all([admin_user, normal_user])
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    with pytest.raises(NotFoundError):
        service.activate_key(normal_user, "NONEXISTENT")


def test_activate_already_used_code_raises_license_error(db_session):
    admin_user = User(email="admin-exc2@test.com", is_admin=True)
    normal_user = User(email="normal-exc2@test.com", is_admin=False, subscription_tier="free")
    db_session.add_all([admin_user, normal_user])
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    keys = service.generate_keys(admin_user, duration_days=30, count=1, tier="pro")

    service.activate_key(normal_user, keys[0])

    with pytest.raises(LicenseError):
        service.activate_key(normal_user, keys[0])


def test_non_admin_generate_keys_raises_permission_denied(db_session):
    normal_user = User(email="normal-gen@test.com", is_admin=False)
    db_session.add(normal_user)
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    with pytest.raises(PermissionDeniedError):
        service.generate_keys(normal_user, duration_days=30, count=1)


def test_non_admin_view_licenses_raises_permission_denied(db_session):
    normal_user = User(email="normal-view@test.com", is_admin=False)
    db_session.add(normal_user)
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    with pytest.raises(PermissionDeniedError):
        service.get_all_licenses(normal_user)


def test_non_admin_delete_license_raises_permission_denied(db_session):
    normal_user = User(email="normal-del@test.com", is_admin=False)
    db_session.add(normal_user)
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    with pytest.raises(PermissionDeniedError):
        service.delete_license(normal_user, "some-id")


def test_delete_nonexistent_license_raises_not_found(db_session):
    admin_user = User(email="admin-del@test.com", is_admin=True)
    db_session.add(admin_user)
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    with pytest.raises(NotFoundError):
        service.delete_license(admin_user, "nonexistent-id")


def test_generate_license_passes_with_valid_data(db_session):
    admin_user = User(email="admin-valid@test.com", is_admin=True)
    db_session.add(admin_user)
    db_session.commit()

    uow = UnitOfWork(db_session)
    service = LicenseService(uow)
    result = service.generate_keys(
        admin_user, duration_days=30, tier="pro", count=1
    )
    assert len(result) == 1
    assert result[0].startswith("PRO-30-")
