# Feature: Client-Side TTS via ONNX Runtime Web + Piper WASM

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Problem Statement

Hiện tại TTS chạy hoàn toàn trên server (Python Piper). Model 50MB mỗi voice, server phải load model vào RAM. Khi scale lên nhiều user, chi phí server tăng.

### 1.2 Success Criteria

- [ ] TTS generation chạy trong browser qua Web Worker + ONNX Runtime
- [ ] Dùng Piper WASM phonemizer từ CDN (espeak-ng)
- [ ] Model cache trong IndexedDB, tự động tải khi cần
- [ ] Progress hiển thị thật từ worker (không còn simulated)
- [ ] Fallback server-side nếu client-side lỗi
- [ ] `npm run build` + tests pass

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | `npm install onnxruntime-web` | Must |
| FR-2 | Viết lại `tts-worker.ts` với Piper WASM phonemizer từ CDN | Must |
| FR-3 | Worker load model + config từ R2 public URL | Must |
| FR-4 | Worker chạy ONNX inference: text → phonemes → audio | Must |
| FR-5 | Worker gửi real progress events (10%→100%) | Must |
| FR-6 | IndexedDB model cache với version check | Must |
| FR-7 | Tạo hook `useTtsGenerate` wrap worker communication | Must |
| FR-8 | `studio/page.tsx` dùng worker, fallback server API | Must |
| FR-9 | Xóa simulated progress timer cũ | Must |
| FR-10 | Build + tests pass | Must |

---

## 3. Out of Scope

- Streaming audio (làm sau, khi text dài)
- Gapless playback
- Pitch shift browser-side

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec | — | All |
