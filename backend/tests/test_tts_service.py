"""Tests for TTSService._apply_user_dictionary and route handler call order."""
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.services.tts_service import TTSService
from app.schemas.tts import DictionaryEntry


# --- Unit tests for _apply_user_dictionary ---

def test_apply_user_dictionary_replaces_word():
    service = TTSService()
    entries = [DictionaryEntry(word="AI", pronunciation="ây ai", priority=5)]
    result = service._apply_user_dictionary("Công nghệ AI rất mạnh.", entries)
    assert result == "Công nghệ ây ai rất mạnh."


def test_apply_user_dictionary_respects_priority_order():
    """Higher priority entries must be applied first to handle overlapping words."""
    service = TTSService()
    entries = [
        DictionaryEntry(word="AI", pronunciation="a i", priority=3),
        DictionaryEntry(word="AI TTS", pronunciation="ây ai ti-ti-xì", priority=8),
    ]
    result = service._apply_user_dictionary("AI TTS sẽ đọc văn bản.", entries)
    # "AI TTS" (priority 8) must be replaced before "AI" (priority 3)
    assert result == "ây ai ti-ti-xì sẽ đọc văn bản."


def test_apply_user_dictionary_empty_returns_unchanged():
    service = TTSService()
    result = service._apply_user_dictionary("Hello world", [])
    assert result == "Hello world"


def test_apply_user_dictionary_no_match_returns_unchanged():
    service = TTSService()
    entries = [DictionaryEntry(word="XYZ", pronunciation="x y z", priority=5)]
    result = service._apply_user_dictionary("Hello world", entries)
    assert result == "Hello world"


# --- Integration test: route handler applies dictionary BEFORE normalization ---

def test_dictionary_applied_before_normalization(client, monkeypatch):
    """Verify text reaching normalize_vietnamese already has dictionary substitutions."""
    from app.api import tts as tts_module

    normalize_received = []

    def fake_normalize(text, mode="standard"):
        normalize_received.append(text)
        return text, None, None, None

    def fake_synthesize(text, voice_id, speed, emotion_params=None):
        return b"RIFF\x00\x00\x00\x00WAVE", 0.5

    async def fake_ensure_model(voice_id):
        return True

    monkeypatch.setattr(tts_module, "normalize_vietnamese", fake_normalize)
    monkeypatch.setattr(tts_module.tts_service, "synthesize", fake_synthesize)
    monkeypatch.setattr(tts_module.tts_service, "_ensure_model", fake_ensure_model)

    client.post(
        "/api/tts/generate",
        json={
            "text": "Cong nghe AI rat manh.",
            "voice_id": "vi_female",
            "speed": 1.0,
            "user_dictionary": [{"word": "AI", "pronunciation": "ay ai", "priority": 5}],
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert len(normalize_received) == 1, "normalize_vietnamese should be called exactly once"
    received_text = normalize_received[0]
    assert "ay ai" in received_text, (
        f"Dictionary was NOT applied before normalize. normalize received: {received_text!r}"
    )
    assert "AI" not in received_text, (
        f"Original word 'AI' should be replaced before normalize. Got: {received_text!r}"
    )

