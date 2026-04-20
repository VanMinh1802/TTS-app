# PLAN: F3.3 - Vietnamese Text Normalization

## Implementation

### 1. Create Schema
- `backend/app/schemas/normalize.py` - Request/Response models

### 2. Create Normalizer Service
- `backend/app/services/normalizer.py` - Text normalization logic

### 3. Create API Endpoint
- `backend/app/api/normalize.py` - POST /tts/normalize

### 4. Add to Main App
- Include router in main.py

---

## Implementation Details

### Normalization Functions

1. **expand_abbreviations()** - Dictionary lookup
2. **number_to_words()** - Digit-to-Vietnamese conversion
3. **normalize_currency()** - Handle đ, $, %
4. **normalize_datetime()** - Dates and times
5. **normalize_url_email()** - Web addresses
6. **normalize_punctuation()** - Spacing rules

### Mode Processing

| Mode | Functions Applied |
|------|-------------------|
| minimal | spacing only |
| standard | abbreviations + numbers + currency + URLs |
| full | all functions |

### Dialect Handling

| Dialect | Number Style |
|--------|--------------|
| northern | linh, bốn, bảy |
| southern | linh, tư, bẩy |
| mixed | auto-detect from input |

---

# Implementation Steps

- [x] 1. Create SPEC ✅
- [ ] 2. Create `backend/app/schemas/normalize.py`
- [ ] 3. Create `backend/app/services/normalizer.py`
- [ ] 4. Create `backend/app/api/normalize.py`
- [ ] 5. Update `backend/app/main.py`
- [ ] 6. Test the API