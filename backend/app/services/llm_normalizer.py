"""
LLM-based text normalizer for Vietnamese TTS.

Supports multiple providers (Gemini, OpenAI) using the user's own API key.
Called only when rule-based normalization cannot handle complex tokens.
"""
import hashlib
import logging
import re
from collections import OrderedDict
from typing import Optional

logger = logging.getLogger(__name__)

# ------------------------------ detection -----------------------------------

# Patterns that signal LLM help is needed AFTER rule-based normalization
_NEEDS_LLM_PATTERNS = [
    re.compile(r'\b[A-Z]{2,6}\b'), # All caps acronyms (CEO, ROI)
    re.compile(r'\b[A-Z][a-z]?[A-Z]\b'), # Mixed caps (PoS)
    # English words heuristic: contains letters not in Vietnamese alphabet (f, j, w, z) or common English endings (ing, ity, tion)
    re.compile(r'\b[A-Za-z]*(?:[fjwzFJWZ]|ing|ity|tion|ment|able|ible)\b'),
    re.compile(r'\b[A-Za-z]+-[A-Za-z]+\b'), # Hyphenated (VN-Index)
    re.compile(r'[$€£¥]\s?\d+(?:\.\d+)?(?:[KkMmBbtT])?\b'), # Currency ($1.5B)
    re.compile(r'\d+(?:\.\d+)?[KkMmBbtT]\b'), # Large numbers (1.5B)
    re.compile(r'[A-Za-z]\+\+'), # C++
]


def needs_llm_normalization(text: str) -> bool:
    """Return True if the text contains tokens that rule-based cannot handle well."""
    return any(p.search(text) for p in _NEEDS_LLM_PATTERNS)


# ------------------------------ prompt --------------------------------------

_SYSTEM_PROMPT = """Bạn là chuyên gia ngôn ngữ học và kỹ sư dữ liệu giọng nói (Speech Data Engineer) đang xây dựng hệ thống Text-to-Speech tiếng Việt.

Nhiệm vụ: Tìm và phiên âm TOÀN BỘ các từ tiếng Anh, thuật ngữ công nghệ, từ viết tắt, con số phức tạp hoặc ký hiệu đặc biệt có trong câu sang dạng phát âm tiếng Việt chuẩn, thân thiện với mô hình máy đọc.

CÁC QUY TẮC CỐT LÕI (TUYỆT ĐỐI TUÂN THỦ):
1. CHỈ TRẢ VỀ JSON: Kết quả trả về phải là một mảng JSON nghiêm ngặt. TUYỆT ĐỐI KHÔNG sử dụng markdown (không có ```json hay ``` ở đầu/cuối), không có văn bản giải thích thừa.
2. FORMAT JSON: `[{"word": "Từ gốc", "pronunciation": "cách-đọc-có-gạch-nối"}]`
3. PHIÊN ÂM TIẾNG ANH: Bắt buộc phân tách các âm tiết bằng dấu gạch nối (VD: "Digital" -> "đi-gi-tờ").
4. ĐỌC CHỮ CÁI VIẾT TẮT: Đọc từng chữ cái (VD: "AI" -> "Ây Ai", "CEO" -> "Xi I Âu").
5. TỪ VAY MƯỢN / IT: Đọc theo thói quen của người Việt (VD: "DevOps" -> "Đép-óp", "microservices" -> "mai-crô-sơ-vít").
6. SỐ VÀ KÝ HIỆU LỚN: Phiên âm cách đọc tiếng Việt đầy đủ (VD: "$1.5B" -> "một phẩy năm tỷ đô la", "C++" -> "xê cộng cộng", "500k" -> "năm trăm ca").

VÍ DỤ ĐẦU RA MONG ĐỢI:
[
  {"word": "Digital Transformation", "pronunciation": "đi-gi-tờ tờ-ran-pho-mây-sần"},
  {"word": "AI", "pronunciation": "Ây Ai"},
  {"word": "ROI", "pronunciation": "A Âu Ai"},
  {"word": "DevOps", "pronunciation": "Đép-óp"},
  {"word": "$1.5B", "pronunciation": "một phẩy năm tỷ đô la"},
  {"word": "C++", "pronunciation": "xê cộng cộng"}
]
"""


def _build_user_message(text: str) -> str:
    return f"Trích xuất và phiên âm các từ phức tạp trong đoạn văn sau:\n\n{text}"


# ------------------------------ cache ---------------------------------------

_MAX_CACHE_SIZE = 512
_result_cache: OrderedDict[str, str] = OrderedDict()


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
        _result_cache.move_to_end(cache_k)  # mark as recently used
        return _result_cache[cache_k], LLM_STATUS_SUCCESS

    try:
        result = await _call_gemini(text, api_key)
        if result:
            import json
            normalized_text = text
            try:
                # Clean markdown if present
                clean_result = result
                if clean_result.startswith("```json"):
                    clean_result = clean_result[7:]
                if clean_result.startswith("```"):
                    clean_result = clean_result[3:]
                if clean_result.endswith("```"):
                    clean_result = clean_result[:-3]
                
                terms = json.loads(clean_result.strip())
                if isinstance(terms, list):
                    terms.sort(key=lambda x: len(x.get("word", "")), reverse=True)
                    for term in terms:
                        word = term.get("word")
                        pronunciation = term.get("pronunciation")
                        if word and pronunciation:
                            normalized_text = normalized_text.replace(word, pronunciation)
            except Exception as e:
                logger.error("Failed to parse LLM terms for normalization: %s", e)
                return text, LLM_STATUS_ERROR

            _result_cache[cache_k] = normalized_text
            # Evict oldest entries if cache is full
            while len(_result_cache) > _MAX_CACHE_SIZE:
                _result_cache.popitem(last=False)
            return normalized_text, LLM_STATUS_SUCCESS

    except Exception as exc:  # noqa: BLE001
        status = _classify_http_error(exc)
        logger.warning(
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

