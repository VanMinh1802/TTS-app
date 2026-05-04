"""Tests for library service."""
from app.core.uow import UnitOfWork
from app.services.library_service import LibraryService
from app.models.audio_record import AudioRecord

def test_list_records(db_session):
    uow = UnitOfWork(db_session)
    service = LibraryService(uow)
    uow.audio_records.create(AudioRecord(user_id="u1", voice_id="v1", text_content="test", file_url="http://x", file_size_bytes=100))
    uow.commit()
    records, total = service.list_user_records("u1")
    assert len(records) == 1
    assert total == 1

def test_delete_nonexistent(db_session):
    uow = UnitOfWork(db_session)
    service = LibraryService(uow)
    from app.core.exceptions import NotFoundError
    raised = False
    try:
        service.delete_record("u1", "nonexistent-id")
    except NotFoundError:
        raised = True
    assert raised
