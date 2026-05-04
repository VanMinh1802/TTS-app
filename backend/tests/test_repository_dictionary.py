"""Tests for dictionary repository."""
from app.models.dictionary import DictionaryEntryModel
from app.repositories.dictionary import DictionaryRepository


def test_create_and_search(db_session):
    repo = DictionaryRepository(db_session)
    entry = repo.create(DictionaryEntryModel(
        user_id="user1", word="hello", pronunciation="xin chào"
    ))
    assert entry.id is not None
    results = repo.search("user1", "hello")
    assert len(results) == 1
    assert results[0].pronunciation == "xin chào"


def test_bulk_upsert(db_session):
    repo = DictionaryRepository(db_session)
    count = repo.bulk_upsert("user1", [
        {"word": "AI", "pronunciation": "ây ai"},
        {"word": "API", "pronunciation": "ây pi ai"},
    ])
    assert count == 2
    results = repo.search("user1", "AI")
    assert len(results) >= 1
