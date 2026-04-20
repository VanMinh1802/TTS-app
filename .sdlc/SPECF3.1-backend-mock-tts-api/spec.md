# SPEC: F3.1 - Mock TTS API

## Overview
Tạo mock TTS API endpoint để test flow Frontend → Backend mà không cần model thật.

---

## Functional Requirements

### API Endpoint
- [ ] `POST /api/v1/tts/generate` - Generate mock audio
- [ ] Request: `{ text, voice_id, speed }`
- [ ] Response: `{ audio_url, duration }`

### Mock Behavior
- [ ] Trả về fake WAV audio file (generated in-memory)
- [ ] Simulate processing delay (1-2 seconds)
- [ ] Support Vietnamese text

---

## API Contract

```python
# Request
class TTSRequest(BaseModel):
    text: str
    voice_id: str = "vi_female"
    speed: float = 1.0

# Response
class TTSResponse(BaseModel):
    audio_url: str
    duration: float
    voice_id: str
```

---

## Acceptance Criteria

- [ ] API endpoint hoạt động
- [ ] Frontend gọi API được
- [ ] Audio playback hoạt động
- [ ] Loading state hiển thị

---

# 👉 APPROVE to proceed with implementation?

- ✅ **APPROVE** - Implement
- ❌ **REJECT** - Request changes
- ❓ **QUESTIONS** - Ask