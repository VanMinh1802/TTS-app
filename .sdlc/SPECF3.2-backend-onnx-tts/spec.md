# SPEC: F3.2 - ONNX TTS Integration

## Overview
Thay thế mock TTS bằng ONNX Runtime inference với thực model.

---

## Architecture

```
R2 Storage                                Backend
┌─────────────────────┐                 ┌──────────────┐
│ piper_vi_female.onnx│──────────────▶│ ONNX Runtime│
└─────────────────────┘  Download    └──────┬───────┘
                                          │
                                          ▼
                                    ┌──────────────┐
                                    │ WAV Output  │
                                    └────────────┘
```

---

## Functional Requirements

### Core Features
- [ ] Download model từ R2 (nếu chưa có local)
- [ ] Load ONNX model vào memory
- [ ] Text → Audio inference
- [ ] Stream audio về frontend

### Voice Models
| ID | Name | Language | Model File |
|----|------|----------|------------|
| vi_female | Vietnamese Female | Vietnamese | piper_vi_female.onnx |
| vi_male | Vietnamese Male | Vietnamese | piper_vi_male.onnx |

---

## API Contract

```python
class TTSRequest(BaseModel):
    text: str
    voice_id: str = "vi_female"
    speed: float = 1.0

class TTSResponse(BaseModel):
    audio_url: str  # base64 data URL
    duration: float
    voice_id: str
```

---

## Acceptance Criteria

- [ ] Thực sự generate speech (không phải mock)
- [ ] Vietnamese voice nghe được
- [ ] Speed adjustment hoạt động
- [ ] Performance chấp nhận được (< 5s generation)

---

## Dependencies

- [x] F3.1 (Mock TTS API)
- [x] R2 Storage (pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev)

---

# 👉 APPROVE to proceed with implementation?

- ✅ **APPROVE** - Implement
- ❌ **REJECT** - Request changes
- ❓ **QUESTIONS** - Ask