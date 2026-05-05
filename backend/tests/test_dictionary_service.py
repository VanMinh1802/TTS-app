"""Tests for persistent dictionary storage."""

import pytest

from app.core.uow import UnitOfWork
from app.models.user import User
from app.schemas.dictionary import DictionaryCreate, DictionaryEntry, DictionaryUpdate
from app.services.dictionary_service import DictionaryService


def create_user(db_session, email: str = "dictionary@example.com") -> User:
    user = User(email=email, name="Dictionary User", password_hash=None)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_dictionary_entries_persist(db_session):
    user = create_user(db_session)
    service = DictionaryService(UnitOfWork(db_session))

    first = service.create_entry(
        user.id,
        DictionaryCreate(word="ABC corp", pronunciation="Công ty ABC"),
    )
    second = service.create_entry(
        user.id,
        DictionaryCreate(word="TTS", pronunciation="ti-ti-xi"),
    )

    entries, total = service.list_entries(user.id)

    assert total == 2
    assert [entry.word for entry in entries] == ["ABC corp", "TTS"]


def test_dictionary_update_and_delete_persist(db_session):
    user = create_user(db_session)
    service = DictionaryService(UnitOfWork(db_session))

    entry = service.create_entry(
        user.id,
        DictionaryCreate(word="AI", pronunciation="a i"),
    )

    updated = service.update_entry(
        user.id,
        entry.id,
        DictionaryUpdate(pronunciation="ây ai"),
    )

    assert updated.pronunciation == "ây ai"

    service.delete_entry(user.id, entry.id)

    entries, total = service.list_entries(user.id)
    assert total == 0
    assert entries == []


def test_dictionary_import_skips_duplicates_and_searches_by_word_and_pronunciation(db_session):
    user = create_user(db_session)
    service = DictionaryService(UnitOfWork(db_session))

    imported, total = service.import_entries(
        user.id,
        [
            DictionaryCreate(word="NASA", pronunciation="na sa"),
            DictionaryCreate(word="nasa", pronunciation="duplicate"),
            DictionaryCreate(word="AI", pronunciation="ây ai"),
        ],
    )

    assert total == 2

    results = service.search_entries(user.id, "sa")
    assert [entry.word for entry in results] == ["NASA"]

    exported = service.export_entries(user.id)
    assert set(entry.word for entry in exported) == {"AI", "NASA"}
