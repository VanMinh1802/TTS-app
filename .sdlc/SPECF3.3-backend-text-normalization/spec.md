# SPEC: F3.3 - Text Normalization API (Vietnamese)

## Overview
Backend API endpoint để normalize text tiếng Việt trước khi TTS generation. Đảm bảo text đầu vào chuẩn hoá để TTS đọc đúng và tự nhiên nhất.

---

## Functional Requirements

### Core Features
- [ ] Text normalization endpoint
- [ ] Abbreviation/acronym expansion
- [ ] Number-to-word conversion (digits → text)
- [ ] Currency/money conversion
- [ ] Date/time normalization  
- [ ] URL/Email normalization
- [ ] Special character handling
- [ ] Vietnamese diacritics preservation
- [ ] Punctuation spacing
- [ ] Mixed English-Vietnamese handling

---

## Vietnamese Text Complexity

### 1. Abbreviations (Viết tắt)

| Category | Input | Output | Notes |
|----------|-------|--------|-------|
| Country | VN | Việt Nam | |
| City | TP HCM | Thành Phố Hồ Chí Minh | |
| Organization | ĐHQG | Đại Học Quốc Gia | |
| Government | Bộ GDĐT | Bộ Giáo Dục và Đào Tạo | |
| Education | THCS | Trung Học Cơ Sở | |
| Time | GĐKG | Giờ Địa Kim Nguyên Kế | |
| Currency | USD | Đô la Mỹ | or "đô la" |
| Internet | 3G | mạng ba G | |
| Tech | IT | Công nghệ Thông tin | |
| Common | Mr | Ông | gender-neutral |
| Common | Mrs | Bà | |
| Common | Ms | Cô | |
| Dr | Tiến sĩ | |
| Vs | Với | |

### 2. Number Conversion (Số → Chữ)

| Number | Northern (Hà Nội) | Southern (TP.HCM) |
|--------|-----------------|-------------------|
| 0 | linh / không | linh / không |
| 1 | một | một |
| 2 | hai | hai |
| 3 | ba | ba |
| 4 | bốn | bốn / tư |
| 5 | năm | năm |
| 6 | sáu | sáu |
| 7 | bảy | bảy / bẩy |
| 8 | tám | tám |
| 9 | chín | chín |
| 10 | mười | mười |
| 11 | mười một | mười một |
| 20 | hai mươi | hai mươi |
| 21 | hai mươi mốt | hai mươi mốt |
| 100 | một trăm | một trăm |
| 101 | một trăm linh một | một trăm linh một |
| 110 | một trăm mười | một trăm mười |
| 200 | hai trăm | hai trăm |
| 1000 | một nghìn / một ngàn | một nghìn / một ngàn |
| 10000 | mười nghìn | mười ngàn |
| 1000000 | một triệu | một triệu |
| 1000000000 | một tỷ | một tỷ |

### 3. Currency (Tiền tệ)

| Format | Input | Output (Northern) | Output (Southern) |
|--------|-------|--------------------|-------------------|
| VND Symbol | 100.000đ | một trăm nghìn đồng | một trăm ngàn đồng |
| VND Code | 100.000 VND | một trăm nghìn đồng | một trăm ngàn đồng |
| USD | $100 | một trăm đô la | một trăm đô la |
| USD | 100 USD | một trăm đô la Mỹ | một trăm đô la Mỹ |
| Percent | 50% | năm mươi phần trăm | năm mươi phần trăm |

### 4. Date/Time (Ngày/Tháng/Năm)

| Format | Input | Output |
|--------|-------|--------|
| Short Date | 20/04/2026 | Hai mươi tháng tư năm hai không hai sáu |
| ISO Date | 2026-04-20 | Hai mươi tháng tư năm hai không hai sáu |
| Month Name | 20 tháng 4 | Hai mươi tháng tư |
| Time | 14h30 | mười bốn giờ ba mươi |
| AM/PM | 2:30 CH | hai giờ ba mươi chiều |
| AM/PM | 2:30 SA | hai giờ ba mươi sáng |

### 5. Special Characters

| Type | Input | Output | Notes |
|------|-------|--------|-------|
| Emoji | 😊 | bi cười | describe |
| Emoji | ❤️ | trái tim | describe |
| Punctuation | "...", "..." | giữ nguyên | preserve |
| Math | 2+2=4 | hai cộng hai bằng bốn | |
| Math | 50% | năm mươi phần trăm | |
| Roman | I, II, III | một, hai, ba | optional |

### 6. Diacritics Preservation (Giữ nguyên dấu)

Must preserve all Vietnamese diacritics:
- ă, ắ, ằ, ẵ, ẳ
- â, ấ, ầ, ẫ, ẩ
- đ (Đ is preserved, d is different)
- ê, ế, ề, ễ, ể
- ô, ố, ồ, ỗ, ổ
- ơ, ớ, ờ, ỡ, ở
- ư, ứ, ừ, ữ, ử
- ơ, ờ (are different)

### 7. Mixed Content (Trộn lẫn)

| Type | Input | Output |
|------|-------|--------|
| English Word | Hello | giữ nguyên hoặc đọc theo phonetics |
| Vietnamese + English | Xin chào AI | Xin chào A I |
| Numbers in Text | Học 2 năm | Học hai năm |

### 8. Punctuation Spacing (Khoảng trắng)

| Input | Output | Notes |
|-------|--------|-------|
| Xin chào! Ông Smith | Xin chào! Ông Smith | |
| Xin chào ... tôi | Xin chào ... tôi | giữ nguyên |
| (0123) 456 | (không một hai ba) bốn năm | số trong ngoặc |

---

## API Contract

```python
# POST /api/v1/tts/normalize

class NormalizeRequest(BaseModel):
    text: str
    mode: str = "standard"  # minimal, standard, full
    dialect: str = "mixed"  # northern, southern, mixed (auto-detect)

class NormalizeResponse(BaseModel):
    normalized_text: str
    original_length: int
    normalized_length: int
    processing_time_ms: float

class NormalizeError(BaseModel):
    detail: str
    code: str  # EMPTY_TEXT, INVALID_MODE, PROCESSING_ERROR
```

### Error Responses

| Code | HTTP | Description |
|------|------|-------------|
| EMPTY_TEXT | 400 | Input text is empty |
| TEXT_TOO_LONG | 400 | Input exceeds 10000 chars |
| INVALID_MODE | 422 | Invalid mode value |
| INVALID_DIALECT | 422 | Invalid dialect value |

---

## Mode Differences

| Mode | Features | Use Case |
|------|---------|----------|
| minimal | punctuation spacing | Quick preprocess |
| standard | abbreviations, numbers, currency, URLs | Most content |
| full | all features + dates, roman numerals | Rich content |

---

## Acceptance Criteria

### Functional
- [ ] Abbreviations expand correctly
- [ ] Numbers convert to Vietnamese words
- [ ] Currency shows correct unit
- [ ] Dates format correctly
- [ ] URLs/emails spelled out
- [ ] Diacritics fully preserved
- [ ] Mixed content handled

### Quality
- [ ] Processing time < 100ms for 5000 chars
- [ ] No data loss (all original meaning preserved)
- [ ] Output readable and natural

### Edge Cases
- [ ] Empty input → error
- [ ] Text too long → error
- [ ] Invalid mode → error with suggestion
- [ ] Unknown abbreviation → keep原文 or spell character-by-character

---

## Dependencies

- [x] F1.1 (FastAPI Setup)

---

# 👉 APPROVE to proceed with implementation?

- ✅ **APPROVE** - Implement comprehensive normalization
- ❌ **REJECT** - Request changes
- ❓ **QUESTIONS** - Ask