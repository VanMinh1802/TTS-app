"""Dependency injection — service factory functions for FastAPI Depends()."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.uow import UnitOfWork
from app.services.auth_service import AuthService
from app.services.quota_service import QuotaService
from app.services.dictionary_service import DictionaryService
from app.services.library_service import LibraryService
from app.services.license_service import LicenseService
from app.services.analytics_service import AnalyticsService


def get_uow(db: Session = Depends(get_db)) -> UnitOfWork:
    return UnitOfWork(db)


def get_auth_service(uow: UnitOfWork = Depends(get_uow)) -> AuthService:
    return AuthService(uow)


def get_quota_service(uow: UnitOfWork = Depends(get_uow)) -> QuotaService:
    return QuotaService(uow)


def get_dictionary_service(uow: UnitOfWork = Depends(get_uow)) -> DictionaryService:
    return DictionaryService(uow)


def get_library_service(uow: UnitOfWork = Depends(get_uow)) -> LibraryService:
    return LibraryService(uow)


def get_license_service(uow: UnitOfWork = Depends(get_uow)) -> LicenseService:
    return LicenseService(uow)


def get_analytics_service(uow: UnitOfWork = Depends(get_uow)) -> AnalyticsService:
    return AnalyticsService(uow)


__all__ = [
    "get_uow",
    "get_auth_service",
    "get_quota_service",
    "get_dictionary_service",
    "get_library_service",
    "get_license_service",
    "get_analytics_service",
]
