import pytest
from app.services.llm_normalizer import _build_user_message, _SYSTEM_PROMPT


def test_system_prompt_contains_json_instruction():
    assert "JSON" in _SYSTEM_PROMPT
    assert "word" in _SYSTEM_PROMPT
    assert "pronunciation" in _SYSTEM_PROMPT


def test_build_user_message_filters_sentences():
    pass
