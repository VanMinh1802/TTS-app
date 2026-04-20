# SPEC: F3.4 - Custom Dictionary API

## Overview
Cho phép user định nghĩa cách đọc tùy chỉnh cho từ/cụm từ, bổ sung cho hệ thống viết tắt mặc định.

---

## Functional Requirements

### Core Features
- [ ] CRUD operations cho custom dictionary entries
- [ ] User-specific dictionary (per-user)
- [ ] Priority rules (user dict > system dict)
- [ ] Batch import/export
- [ ] Search functionality

### Data Model

```python
class DictionaryEntry(BaseModel):
    id: str
    user_id: str
    word: str            # Từ cần đọc lại
    pronunciation: str    # Cách đọc mong muốn
    category: str        # Tên riêng, thuật ngữ, viết tắt...
    created_at: datetime
    updated_at: datetime

class DictionaryListResponse(BaseModel):
    entries: list[DictionaryEntry]
    total: int
    page: int
    page_size: int
```

### API Endpoints

| Method | Endpoint | Description |
|-------|----------|-------------|
| GET | /dictionary | List user's entries |
| POST | /dictionary | Add new entry |
| PUT | /dictionary/{id} | Update entry |
| DELETE | /dictionary/{id} | Delete entry |
| POST | /dictionary/import | Batch import |
| GET | /dictionary/export | Export as JSON |

---

## Supported Pronunciation Formats

| Type | Word | Input | Output |
|------|------|-------|--------|
| Word replacement | AI | AI | A I |
| Phonetic | Hello | Hello | Xin chào |
| Abbreviation | CTO | CTO | Trưởng Phòng Công Nghệ |

---

## Use Cases

1. **Tên riêng** - "Elon Musk" → "Ê-lôn Mờ-xkc"
2. **Thương hiệu** - "Apple" → "Áp-po"
3. **Thuật ngữ** - "API" → "A P I"
4. **Viết tắt** - "CEO" → "Giám Đốc Điều Hành"

---

## Acceptance Criteria

- [ ] User có thể thêm/xoá/sửa entries
- [ ] Custom entries ưu tiên hơn system dict
- [ ] Import/export JSON hoạt động
- [ ] Search tìm nhanh

---

## Dependencies

- [x] F3.3 (Text Normalization)
- [x] F1.3 (JWT Auth)

---

# 👉 APPROVE to proceed with implementation?

- ✅ **APPROVE** - Implement
- ❌ **REJECT** - Request changes
- ❓ **QUESTIONS** - Ask