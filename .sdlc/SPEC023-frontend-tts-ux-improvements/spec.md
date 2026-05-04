# Feature: TTS Studio UX Improvements

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Problem Statement

### 1.1 Issues

1. **isTextOverLimit không hoạt động** — `TextInput` hiển thị cảnh báo đỏ khi >5000 ký tự nhưng không báo cho parent → nút Generate không bị disable
2. **Thiếu progress tracking** — chỉ có boolean `generating`, người dùng không biết tiến độ
3. **Không auto-play** — phải bấm play thủ công sau khi generate xong
4. **Không preview voice** — không có nút nghe thử giọng trước khi chọn
5. **Settings không persist** — voice và speed reset mỗi lần reload (chỉ draft text được lưu)

### 1.2 Success Criteria

- [ ] `isTextOverLimit` hoạt động — nút Generate bị disable khi >5000 ký tự
- [ ] Progress bar 0-100% hiển thị trong lúc generate
- [ ] Audio tự động play sau khi generate thành công
- [ ] Nút preview sample cạnh mỗi voice (nếu backend có `sample_url`)
- [ ] Voice và speed được lưu vào localStorage, restore khi reload

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | `TextInput` gọi callback `onOverLimit` khi vượt 5000 ký tự | Must |
| FR-2 | Hiển thị progress bar (ước lượng thời gian) trong lúc generate | Must |
| FR-3 | Auto-play audio sau khi generate thành công | Must |
| FR-4 | Nút play preview sample trong VoiceSelector | Should |
| FR-5 | Lưu `selectedVoice` và `speed` vào localStorage, restore khi mount | Must |
| FR-6 | Build + tests pass | Must |

---

## 3. Out of Scope

- Server-side progress streaming (backend change)
- Real ONNX progress từ Web Worker (dead code, không sử dụng)
- Thay đổi cấu trúc `StudioVoice` type

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec | — | All |
