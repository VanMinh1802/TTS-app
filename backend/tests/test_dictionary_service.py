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


def test_dictionary_entries_persist_and_sort_by_priority(db_session):
    user = create_user(db_session)
    service = DictionaryService(UnitOfWork(db_session))

    first = service.create_entry(
        user.id,
        DictionaryCreate(word="ABC corp", pronunciation="Công ty ABC", priority=3),
    )
    second = service.create_entry(
        user.id,
        DictionaryCreate(word="TTS", pronunciation="ti-ti-xi", priority=8),
    )

    assert DictionaryEntry.model_validate(second, from_attributes=True).priority == 8
    assert DictionaryEntry.model_validate(first, from_attributes=True).priority == 3

    entries, total = service.list_entries(user.id)

    assert total == 2
    assert [entry.word for entry in entries] == ["TTS", "ABC corp"]
    assert [entry.priority for entry in entries] == [8, 3]


def test_dictionary_update_and_delete_persist(db_session):
    user = create_user(db_session)
    service = DictionaryService(UnitOfWork(db_session))

    entry = service.create_entry(
        user.id,
        DictionaryCreate(word="AI", pronunciation="a i", priority=2),
    )

    updated = service.update_entry(
        user.id,
        entry.id,
        DictionaryUpdate(pronunciation="ây ai", priority=10),
    )

    assert updated.pronunciation == "ây ai"
    assert updated.priority == 10

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
            DictionaryCreate(word="NASA", pronunciation="na sa", priority=5),
            DictionaryCreate(word="nasa", pronunciation="duplicate", priority=1),
            DictionaryCreate(word="AI", pronunciation="ây ai", priority=9),
        ],
    )

    assert total == 2
    assert [entry.word for entry in imported] == ["AI", "NASA"]

    results = service.search_entries(user.id, "sa")
    assert [entry.word for entry in results] == ["NASA"]

    exported = service.export_entries(user.id)
    assert [entry.word for entry in exported] == ["AI", "NASA"]
