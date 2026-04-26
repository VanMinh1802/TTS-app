"""
LLM-based text normalizer for Vietnamese TTS.

Supports multiple providers (Gemini, OpenAI) using the user's own API key.
Called only when rule-based normalization cannot handle complex tokens.
"""
import hashlib
import re
from functools import lru_cache
from typing import Optional

# ------------------------------ detection -----------------------------------

# Patterns that signal LLM help is needed AFTER rule-based normalization
_NEEDS_LLM_PATTERNS = [
    re.compile(r'\b[A-Z]{2,6}\b'), # All caps acronyms (CEO, ROI)
    re.compile(r'\b[A-Z][a-z]?[A-Z]\b'), # Mixed caps (PoS)
    # English words heuristic: contains letters not in Vietnamese alphabet (f, j, w, z) or common English endings (ing, ity, tion)
    re.compile(r'\b[A-Za-z]*(?:[fjwzFJWZ]|ing|ity|tion|ment|able|ible)\b'),
    re.compile(r'\b[A-Za-z]+-[A-Za-z]+\b'), # Hyphenated (VN-Index)
]


def needs_llm_normalization(text: str) -> bool:
    """Return True if the text contains tokens that rule-based cannot handle well."""
    return any(p.search(text) for p in _NEEDS_LLM_PATTERNS)


# ------------------------------ prompt --------------------------------------

_SYSTEM_PROMPT = """Bạn là một phát thanh viên chuyên nghiệp người Việt đang chuẩn bị đọc bản thảo cho hệ thống Text-to-Speech.

Nhiệm vụ: Chuyển đoạn văn bản chứa các từ tiếng Anh, thuật ngữ, từ viết tắt thành dạng phát âm tiếng Việt tự nhiên, dễ đọc.

NGUYÊN TẮC QUAN TRỌNG:
1. CHỈ sửa đổi những từ cần thiết (tiếng Anh, viết tắt).
2. GIỮ NGUYÊN cấu trúc câu, từ vựng tiếng Việt, không dịch nghĩa, không thêm bớt thông tin.
3. KHÔNG giải thích, KHÔNG markdown, CHỈ trả về đoạn văn đã xử lý.

VÍ DỤ 1:
Input: "Công ty ký hợp đồng hedging trị giá lớn."
Output: "Công ty ký hợp đồng hét-ging trị giá lớn."

VÍ DỤ 2:
Input: "Chỉ số VN-Index hôm nay tăng điểm."
Output: "Chỉ số Vê Nờ Ín-đếch hôm nay tăng điểm."

VÍ DỤ 3:
Input: "Hệ thống sử dụng cơ chế PoS (Proof of Stake) để xác thực."
Output: "Hệ thống sử dụng cơ chế Pê Ô Ét, P-rúp Ọp Tếch để xác thực."
"""


def _build_user_message(text: str) -> str:
    return f"Xử lý đoạn văn sau:\n\n{text}"


# ------------------------------ cache ---------------------------------------

@lru_cache(maxsize=256)
def _cached_normalize(text_hash: str, text: str, provider: str) -> str:
    """Cache hit returns immediately. Actual call happens on miss."""
    return text  # placeholder — overridden at call site


_result_cache: dict[str, str] = {}


def _cache_key(text: str, provider: str) -> str:
    return hashlib.sha256(f"{provider}:{text}".encode()).hexdigest()


# ------------------------------ providers -----------------------------------

async def _call_gemini(text: str, api_key: str) -> str:
    """Call Google Gemini Flash API."""
    import httpx

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    payload = {
        "system_instruction": {"parts": [{"text": _SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": _build_user_message(text)}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048,
        },
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, params={"key": api_key})
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


# ------------------------------ status codes --------------------------------

LLM_STATUS_SUCCESS        = "success"
LLM_STATUS_INVALID_KEY    = "invalid_key"
LLM_STATUS_RATE_LIMIT     = "rate_limit"
LLM_STATUS_QUOTA_EXCEEDED = "quota_exceeded"
LLM_STATUS_ERROR          = "error"
LLM_STATUS_SKIPPED        = "skipped"   # text not complex / no key


def _classify_http_error(exc: Exception) -> str:
    """Map httpx HTTP errors to user-friendly status codes."""
    msg = str(exc)
    if "401" in msg:
        return LLM_STATUS_INVALID_KEY
    if "429" in msg:
        return LLM_STATUS_RATE_LIMIT
    if "402" in msg or "quota" in msg.lower():
        return LLM_STATUS_QUOTA_EXCEEDED
    return LLM_STATUS_ERROR


# ------------------------------ public API ----------------------------------

async def llm_normalize(text: str, api_key: str) -> tuple[str, str]:
    """
    Normalize Vietnamese text using Google Gemini Flash.

    Returns:
        (normalized_text, status) where status is one of the LLM_STATUS_* constants.
        On failure, returns (original_text, error_status) so TTS still works.
    """
    if not api_key:
        return text, LLM_STATUS_SKIPPED

    cache_k = _cache_key(text, "gemini")
    if cache_k in _result_cache:
        return _result_cache[cache_k], LLM_STATUS_SUCCESS

    try:
        result = await _call_gemini(text, api_key)
        if result:
            _result_cache[cache_k] = result
            return result, LLM_STATUS_SUCCESS

    except Exception as exc:  # noqa: BLE001
        import logging
        status = _classify_http_error(exc)
        logging.getLogger(__name__).warning(
            "LLM normalization failed (%s): %s — falling back to rule-based", status, exc,
        )
        return text, status

    return text, LLM_STATUS_ERROR


async def validate_gemini_key(api_key: str) -> tuple[bool, str]:
    """
    Validate a Gemini API key with a minimal test request.

    Returns:
        (is_valid, status) — status is one of the LLM_STATUS_* constants.
    """
    try:
        await _call_gemini("test", api_key)
        return True, LLM_STATUS_SUCCESS
    except Exception as exc:
        status = _classify_http_error(exc)
        return False, status

