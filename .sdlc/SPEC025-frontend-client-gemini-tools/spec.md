# Feature: Client-Side Gemini Studio Tools

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-05

---

## 1. Problem Statement

Thay thế tính năng "Phân tích từ khó" (extract-terms) cũ bằng 3 công cụ Gemini chạy trực tiếp trong browser:

1. **Grammar Fix** — Sửa lỗi chính tả, ngữ pháp tiếng Việt trước khi TTS
2. **Pronunciation Check** — Phát hiện từ khó đọc + highlight + thêm vào từ điển
3. **Smart Chunking** — Chia text dài thành đoạn logic, generate tuần tự

### 1.2 Benefits

- Text không qua server (client-side Gemini SDK)
- User tự quản lý API key (localStorage)
- Google API Key Restrictions bảo vệ key

### 1.3 Success Criteria

- [ ] 3 nút trong Studio: Sửa chính tả, Kiểm tra phát âm, Chia đoạn
- [ ] Gemini gọi trực tiếp từ browser (không backend)
- [ ] Grammar Fix: modal diff preview → apply
- [ ] Pronunciation Check: highlight từ + nút "Thêm vào từ điển"
- [ ] Smart Chunking: hiển thị chunks + generate tuần tự
- [ ] Xóa CopilotDictionaryModal cũ + `/extract-terms` endpoint
- [ ] `npm run build` + tests pass

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | `npm install @google/generative-ai` | Must |
| FR-2 | Tạo `src/lib/gemini/client.ts` — wrapper call Gemini API | Must |
| FR-3 | Tạo `src/lib/gemini/prompts.ts` — system prompts cho 3 action | Must |
| FR-4 | Grammar Fix: gọi Gemini → modal diff → apply text | Must |
| FR-5 | Pronunciation Check: gọi Gemini → highlight + thêm dict | Must |
| FR-6 | Smart Chunking: gọi Gemini → hiển thị chunks → generate tuần tự | Must |
| FR-7 | Xóa CopilotDictionaryModal.cũ + voice-api.ts extractTerms | Must |
| FR-8 | Xóa backend `/extract-terms` endpoint + `extract_terms()` trong llm_normalizer | Must |
| FR-9 | Build + tests pass | Must |

---

## 3. Out of Scope

- Streaming Gemini response
- Offline Gemini (Gemini Nano)
- Multi-turn chat

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-05 | v1.0 | Kilo | Initial spec | — | All |
