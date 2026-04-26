# Feature: Auto-Tagging Emotion Tags for TTS

> **Status:** Draft | Review | Approved
> **Author:** Developer
> **Date:** 2026-04-22
> **Related Issues:** #

---

## 1. Problem Statement

### 1.1 User Problem

Người dùng muốn tạo TTS với nhiều cảm xúc khác nhau (ngạc nhiên, vui, buồn, tức giận...) nhưng:
- Không muốn kéo thanh trượt phức tạp (sliders)
- Muốn viết kịch bản tự nhiên như đang viết script phim/kịch
- Không cần là chuyên gia âm thanh

### 1.2 Business Impact

- Tăng engagement với tính năng "thông minh" tự nhận diện cảm xúc
- Giảm learning curve cho người dùng mới
- Tạo điểm khác biệt so với các TTS thông thường

### 1.3 Success Criteria

- [ ] User có thể gõ `(Cảm xúc)` để tag cảm xúc cho đoạn text tiếp theo
- [ ] Emotion tags được highlight trong editor
- [ ] Khi generate, hệ thống tự parse và apply cảm xúc tương ứng
- [ ] Fallback thông minh khi gõ sai tên cảm xúc (exact → keyword map → fuzzy)
- [ ] User có thể tùy chỉnh params per emotion qua UI

---

## 2. User Stories & Acceptance Criteria

### Story 1: Tag Emotion trong Segment Editor

**As a** người dùng TTS,
**I want** gõ `(Ngạc nhiên) Ơ... An?` trong segment editor,
**so that** hệ thống hiểu và đọc đoạn đó với giọng ngạc nhiên.

#### Acceptance Criteria

- **Given** User gõ `(Ngạc nhiên) Ơ... An? (Cười) Lâu quá không gặp.`,
  **When** Text được parse,
  **Then** Tách thành 2 chunks: [{"emotion": "ngạc nhiên", "text": "Ơ... An?"}, {"emotion": "cười", "text": "Lâu quá không gặp."}]

- **Given** User gõ `(Ngạc nhiên) Ơ... An?`,
  **When** User bấm Save Segment,
  **Then** Emotion params được lưu vào database cùng với segment

- **Given** User reload trang,
  **When** Hiển thị segment,
  **Then** Text gốc `(Ngạc nhiên) Ơ... An?` được hiển thị (không strip tag)

### Story 2: Emotion Fallback

**As a** người dùng TTS,
**I want** gõ `(Vui vẻ) Chào bạn` và hệ thống tự map sang "cười",
**so that** Không cần nhớ chính xác tên cảm xúc.

#### Acceptance Criteria

- **Given** User gõ `(Vui vẻ)` (không có trong dictionary chính),
  **When** Parse,
  **Then** Tự map sang "cười" (keyword match)

- **Given** User gõ `(Vuiw)` (sai chính tả),
  **When** Parse với exact + keyword fail,
  **Then** Dùng fuzzy match → gợi ý "vui" hoặc "cười"

### Story 3: Emotion Settings UI

**As a** người dùng TTS,
**I want** có UI để tùy chỉnh params (length_scale, noise_scale) cho từng cảm xúc,
**so that** Fine-tune giọng đọc theo ý muốn.

#### Acceptance Criteria

- **Given** User mở Emotion Settings Panel,
  **Then** Hiển thị list các emotions với sliders cho length_scale, noise_scale

- **Given** User điều chỉnh "ngạc nhiên" length_scale từ 0.8 → 0.6,
  **When** Save,
  **Then** Custom params được lưu vào database, override default

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Parse emotion tags `(Cảm xúc)` bằng Regex | Must |
| FR-2 | Apply emotion cho text tiếp theo tag | Must |
| FR-3 | Highlight emotion tags trong editor UI | Must |
| FR-4 | Fallback: Exact → Keyword Map → Fuzzy Match | Must |
| FR-5 | Lưu emotion_params vào Segment database | Must |
| TTS generate với emotion params | Must |
| FR-7 | UI tùy chỉnh emotion params | Should |
| FR-8 | API lưu custom emotion dictionary per user | Should |

### 3.2 Edge Cases

- Text không có emotion tag → dùng default (bình thường)
- Nhiều emotion tags liên tiếp không có text → bỏ qua empty chunks
- Emotion không hợp lệ → fallback theo thứ tự exact → keyword → fuzzy
- Database fail → dùng default dictionary

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Unknown emotion (no fuzzy match) | Dùng "default" emotion |
| Empty text sau emotion tag | Bỏ qua chunk đó |
| Database unavailable | Dùng frontend default dict |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Parse 1000 ký tự text: < 10ms
- Emotion lookup: < 1ms

### 4.2 Security

- Input validation: strip HTML/scripts trong emotion tags
- User chỉ access được emotion dict của chính mình

### 4.3 Constraints

- Cú pháp: `(Tên cảm xúc)` - dấu ngoặc đơn
- Tên cảm xúc: tiếng Việt, không phân biệt hoa thường
- Piper params: length_scale (0.5-2.0), noise_scale (0.3-1.0)

---

## 5. Unit Test Cases (TDD)

### 5.1 The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### 5.2 Test Case Registry

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | emotion-parser.test.ts | Parse single emotion tag | RED |
| TC-02 | emotion-parser.test.ts | Parse multiple emotion tags | RED |
| TC-03 | emotion-parser.test.ts | Handle text without emotion | RED |
| TC-04 | emotion-dict.test.ts | Exact match lookup | RED |
| TC-05 | emotion-dict.test.ts | Keyword map fallback | RED |
| TC-06 | emotion-dict.test.ts | Fuzzy match fallback | RED |
| TC-07 | emotion-dict.test.ts | Return default when no match | RED |

### 5.3 Test Case Template

#### TC-01: Parse single emotion tag

**Given**: Text `(Ngạc nhiên) Ơ... An?`
**When**: Parse với regex
**Then**: Return `[{"emotion": "ngạc nhiên", "text": "Ơ... An?"}]`

**[RED]** Write the failing test:

```typescript
// src/lib/tts/emotion-parser.test.ts
import { parseEmotionTags } from './emotion-parser';

test('TC-01: Parse single emotion tag', () => {
  const result = parseEmotionTags('(Ngạc nhiên) Ơ... An?');
  expect(result).toEqual([{ emotion: 'ngạc nhiên', text: 'Ơ... An?' }]);
});
```

**[RED]** Run test, verify it fails with expected error.

**[GREEN]** Write minimal implementation.

**[GREEN]** Run test, verify it passes.

**[REFACTOR]** (optional)

---

## 6. Boundaries

### [ALLOW] Always Do

- Viết test trước khi viết code (TDD)
- Commit thường xuyên
- Chạy lint/typecheck trước khi commit

### [CAUTHION] Ask First

- Thay đổi database schema (cần migration)
- Thêm dependencies mới

### [FORBID] Never Do

- Commit secrets/API keys
- Viết code trước khi viết test

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | TDD Status |
|-------------|-------------|------------|
| FR-1 | Unit test: parseEmotionTags | Pending (RED) |
| FR-2 | Unit test: multiple tags | Pending (RED) |
| FR-4 | Unit test: fallback chain | Pending (RED) |
| FR-6 | Integration: generate with emotions | Manual |

### 7.2 Acceptance Checklist

- [ ] User stories implemented
- [ ] All acceptance criteria met
- [ ] Edge cases handled
- [ ] All TDD test cases follow RED-GREEN-REFACTOR cycle

---

## 8. Out of Scope

- Text-to-speech generation logic (đã có worker)
- Voice selection/management
- Audio export functionality

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-04-22 | v1.0 | Developer | Initial spec | — | All |

### Change Rules

1. Every change must be logged — no silent edits
2. Version format: v{major}.{minor}
3. Reason must be explicit
4. Never delete old entries — append only
