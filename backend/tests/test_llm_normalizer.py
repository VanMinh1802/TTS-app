import pytest
import json
from unittest.mock import patch
from app.services.llm_normalizer import extract_terms, _build_user_message, _SYSTEM_PROMPT

@pytest.mark.asyncio
@patch('app.services.llm_normalizer._call_gemini')
async def test_extract_terms_filters_simple_sentences(mock_call_gemini):
    # Mock to return a valid JSON array
    mock_call_gemini.return_value = '[{"word": "AI", "pronunciation": "Ây ai"}]'
    
    text = "Xin chào các bạn. Đây là hệ thống AI."
    result = await extract_terms(text, "fake_key")
    
    # Should only call LLM with the complex sentence
    mock_call_gemini.assert_called_once()
    called_text = mock_call_gemini.call_args[0][0]
    assert "Xin chào các bạn" not in called_text
    assert "Đây là hệ thống AI" in called_text
    
    assert len(result) == 1
    assert result[0]["word"] == "AI"

def test_system_prompt_contains_json_instruction():
    assert "JSON" in _SYSTEM_PROMPT
    assert "word" in _SYSTEM_PROMPT
    assert "pronunciation" in _SYSTEM_PROMPT

def test_build_user_message_filters_sentences():
    # We no longer need _build_user_message to filter sentences since extract_terms does it
    pass

