# PLAN: F3.2 - ONNX TTS Integration

## Implementation

### 1. Create TTS Service
- `backend/app/services/tts_service.py` - ONNX inference logic

### 2. Update TTS API
- `backend/app/api/tts.py` - Use real service

### 3. Add Dependencies
- `onnxruntime`
- `piper-phonemize` (for phoneme conversion)

---

# Implementation Steps

- [x] 1. Create SPEC
- [ ] 2. Create `backend/app/services/tts_service.py`
- [ ] 3. Update `backend/app/api/tts.py`
- [ ] 4. Install dependencies
- [ ] 5. Test