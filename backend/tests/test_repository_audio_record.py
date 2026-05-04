"""Tests for audio record repository."""
from app.models.audio_record import AudioRecord
from app.repositories.audio_record import AudioRecordRepository

def test_audio_record_crud(db_session):
    repo = AudioRecordRepository(db_session)
    r = repo.create(AudioRecord(user_id="u1", voice_id="v1", text_content="hello", file_url="http://x", file_size_bytes=100))
    assert r.id is not None
    records, total = repo.get_by_user("u1")
    assert total == 1
    assert repo.get_user_record(r.id, "u1") is not None
    assert repo.get_user_record(r.id, "u2") is None
