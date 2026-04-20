# SPEC: F2.5 - TTS Generator UI

## Overview
Xây dựng TTS Studio page - main interface để generate speech từ text input.

---

## Functional Requirements

### Main Features

#### Text Input Panel
- [x] Textarea cho text input (max 5000 chars)
- [x] Character counter
- [x] Clear button

#### Voice Settings Panel
- [x] Voice selection (Vietnamese Female, Vietnamese Male, English US Female)
- [x] Speed slider (0.5x - 2x)
- [x] Pitch slider
- [x] Volume slider

#### Generate Button
- [x] Neo-Brutalism style button
- [x] Loading state với spinner
- [x] Disabled khi text empty

#### Audio Preview Panel
- [x] Empty state với instructions
- [x] Generating state với animation
- [x] Ready state với play button
- [x] Download button
- [x] Copy button

#### Export Options
- [x] Format selection (MP3, WAV)

---

## UI Layout

```
┌─────────────────────────────────────────┐
│  TTS Studio                             │
├────────────────────┬────────────────────┤
│  Text Input        │  Audio Preview     │
│  ─────────────     │  ─────────────     │
│                    │                    │
│  Voice Settings   │  Export Options   │
│  ─────────────     │                    │
│                    │                    │
│  [Generate Button]│                    │
└────────────────────┴────────────────────┘
```

---

## Acceptance Criteria

- [x] User có thể nhập text
- [x] User có thể chọn voice
- [x] User có thể điều chỉnh speed/pitch/volume
- [x] Generate button trigger generation
- [x] Loading state hiển thị trong generation
- [x] Audio preview sau khi generate xong
- [x] Download và copy audio

---

## Dependencies

- [x] F2.3 (App Router)
- [x] F2.2 (shadcn/ui)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ