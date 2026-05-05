import base64
import pytest
from unittest.mock import patch, MagicMock

def test_batch_sync_uses_audio_mp3_when_available():
    """batch_sync should upload with audio/mpeg when audio_mp3 field is present."""
    from app.services.library_service import LibraryService

    mock_db = MagicMock()
    service = LibraryService(mock_db)

    mp3_bytes = b'\xff\xfb\x90\x00' + b'\x00' * 100
    records = [
        {
            "id": "rec1",
            "text_content": "hello",
            "voice_id": "v1",
            "audio_data": "AAAA",
            "audio_mp3": base64.b64encode(mp3_bytes).decode(),
            "file_size_bytes": len(mp3_bytes),
            "duration": 1.5,
        },
    ]

    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.library_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"
                result = service.batch_sync("user1", records)

    assert len(result["synced"]) == 1
    upload_call = mock_r2.upload_file.call_args
    assert upload_call.kwargs["content_type"] == "audio/mpeg"
    assert ".mp3" in upload_call.kwargs["object_name"]


def test_batch_sync_falls_back_to_audio_data():
    """batch_sync should use audio_data (WAV) when audio_mp3 is not present."""
    from app.services.library_service import LibraryService

    mock_db = MagicMock()
    service = LibraryService(mock_db)

    records = [
        {"id": "rec1", "text_content": "hello", "voice_id": "v1",
         "audio_data": "AAAA", "file_size_bytes": 100, "duration": 1.5},
    ]

    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.library_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"
                result = service.batch_sync("user1", records)

    assert len(result["synced"]) == 1
    upload_call = mock_r2.upload_file.call_args
    assert upload_call.kwargs["content_type"] == "audio/wav"
    assert ".wav" in upload_call.kwargs["object_name"]


def test_batch_sync_handles_invalid_audio_mp3():
    """batch_sync should fall back to audio_data when audio_mp3 is invalid base64."""
    from app.services.library_service import LibraryService

    mock_db = MagicMock()
    service = LibraryService(mock_db)

    records = [
        {
            "id": "rec1",
            "text_content": "hello",
            "voice_id": "v1",
            "audio_data": "AAAA",
            "audio_mp3": "!!!not-valid-base64!!!",
            "file_size_bytes": 100,
            "duration": 1.5,
        },
    ]

    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.library_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"
                result = service.batch_sync("user1", records)

    assert len(result["synced"]) == 1
    upload_call = mock_r2.upload_file.call_args
    assert upload_call.kwargs["content_type"] == "audio/wav"
