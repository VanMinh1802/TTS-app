"""Tests for DI factory functions."""
import pytest
from app.core.di import get_uow, get_quota_service, get_auth_service, get_dictionary_service
from app.core.uow import UnitOfWork


def test_get_uow_returns_unit_of_work(db_session):
    uow = get_uow(db_session)
    assert isinstance(uow, UnitOfWork)
    assert uow.users is not None
    assert uow.quotas is not None


def test_get_dictionary_service_uses_uow(db_session):
    uow = get_uow(db_session)
    service = get_dictionary_service(uow)
    assert service.uow is not None
    assert service.uow is uow
