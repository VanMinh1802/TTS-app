# SPEC: F3.5 - Multi-language Code-switching

## Overview
Xử lý text có chứa nhiều ngôn ngữ (VN + English), tự động nhận diện và xử lý đúng cách cho từng ngôn ngữ.

---

## Functional Requirements

### Core Features
- [ ] Language detection (VN vs EN)
- [ ] Mixed content handling
- [ ] Language tag preservation
- [ ] Text chunking by language

### Language Detection

| Input | Detected | Notes |
|-------|---------|-------|
| Xin chào | Vietnamese | |
| Hello | English | |
| Xin chào Hello | Mixed | |
| AI và Machine Learning | Mixed | |
| Tôi yêu Việt Nam | Vietnamese | |

### Mixed Content Examples

| Input | Expected Output |
|-------|----------------|
| "AI là công nghệ" | ["AI là công nghệ"] - EN keep, VN normalize |
| "Tôi học English" | EN word kept as-is |
| "100% perfect" | number + EN word |

### Processing Rules

| Language | Processing | Output |
|----------|------------|--------|
| Vietnamese | Full normalization | Tiếng Việt |
| English (common) | Spell character | A I |
| English (brand) | Keep as-is or phonetic | Apple |
| Numbers | Convert to VN | một trăm |
| Mixed | Process separately | Combine |

---

## API Contract

```python
# POST /api/v1/tts/detect-language

class DetectRequest(BaseModel):
    text: str

class DetectResponse(BaseModel):
    language: str  # vietnamese, english, mixed
    confidence: float
    segments: list[LanguageSegment]

class LanguageSegment(BaseModel):
    text: str
    language: str
    start_pos: int
    end_pos: int
```

---

## Use Cases

1. **Pure VN text** → Normalize normally
2. **Pure EN text** → Keep or spell out
3. **Mixed (code-switching)** → Process by segment, combine output

---

## Acceptance Criteria

- [ ] Correctly detect VN/EN/mixed
- [ ] Segments properly split
- [ ] Handle 90%+ cases
- [ ] Fast (< 50ms)

---

## Dependencies

- [x] F3.3 (Text Normalization)

---

# 👉 APPROVE to proceed with implementation?

- ✅ **APPROVE** - Implement
- ❌ **REJECT** - Request changes
- ❓ **QUESTIONS** - Ask