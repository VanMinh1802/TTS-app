"""Tests for Unit of Work."""
import pytest
from app.core.uow import UnitOfWork
from app.repositories.user import UserRepository
from app.repositories.quota import QuotaRepository
from app.repositories.dictionary import DictionaryRepository
from app.repositories.emotion_dict import EmotionDictRepository
from app.repositories.audio_record import AudioRecordRepository
from app.repositories.license import LicenseKeyRepository


def test_uow_provides_all_repos(db_session):
    uow = UnitOfWork(db_session)
    assert isinstance(uow.users, UserRepository)
    assert isinstance(uow.quotas, QuotaRepository)
    assert isinstance(uow.dictionaries, DictionaryRepository)
    assert isinstance(uow.emotion_dicts, EmotionDictRepository)
    assert isinstance(uow.audio_records, AudioRecordRepository)
    assert isinstance(uow.licenses, LicenseKeyRepository)


def test_uow_context_manager(db_session):
    from app.models.user import User
    uow = UnitOfWork(db_session)
    with uow:
        user = uow.users.create(User(email="ctx@test.com", name="Ctx Test"))
        assert user.id is not None
    # After context exit, session should be committed
    retrieved = db_session.get(User, user.id)
    assert retrieved is not None
    assert retrieved.email == "ctx@test.com"
