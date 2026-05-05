# Client-Side Gemini Studio Tools — Implementation Plan

> **For agentic workers:** Use sdlc:subagent-driven-development to implement

**Goal:** Replace "Phân tích từ khó" with 3 client-side Gemini tools.

**Architecture:** `@google/generative-ai` SDK gọi trực tiếp từ browser. API key từ localStorage. Backend không liên quan.

---

> **Spec:** [spec.md](./spec.md)

---

## Task 1: Install + Create Gemini client wrapper

### `npm install @google/generative-ai`

### `src/lib/gemini/client.ts` (new)

````typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export async function callGemini(
  prompt: string,
  text: string,
): Promise<GeminiResult> {
  const apiKey =
    typeof window !== "undefined"
      ? localStorage.getItem("gemini_api_key")
      : null;
  if (!apiKey) {
    return {
      success: false,
      error: "Vui lòng cấu hình Gemini API Key trong Cài đặt.",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(`${prompt}\n\nTEXT:\n${text}`);
    const response = result.response.text();

    // Strip markdown code fences if present
    const json = response
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
    return { success: true, data: JSON.parse(json) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gemini API error",
    };
  }
}
````

---

## Task 2: Create prompts `src/lib/gemini/prompts.ts` (new)

```typescript
export const GRAMMAR_FIX_PROMPT = `Bạn là chuyên gia ngôn ngữ tiếng Việt. Nhiệm vụ: sửa lỗi chính tả, ngữ pháp, dấu câu trong text. Giữ nguyên ý nghĩa, chỉ sửa lỗi.

Trả về JSON:
{
  "original": "text gốc",
  "corrected": "text đã sửa",
  "changes": [
    { "word": "từ sai", "fix": "từ đúng", "reason": "lý do" }
  ]
}`;

export const PRONUNCIATION_CHECK_PROMPT = `Bạn là chuyên gia ngữ âm tiếng Việt. Tìm TẤT CẢ từ/cụm từ có thể bị TTS đọc sai: tiếng Anh, viết tắt, số phức tạp, ký hiệu đặc biệt, từ vay mượn.

Trả về JSON:
{
  "terms": [
    { "word": "ROI", "pronunciation": "A Âu Ai", "reason": "Viết tắt tiếng Anh" }
  ]
}`;

export const SMART_CHUNKING_PROMPT = `Bạn là chuyên gia xử lý văn bản. Chia text thành các đoạn logic theo chủ đề/câu. Mỗi đoạn 300-600 ký tự. Giữ nguyên văn bản, không sửa.

Trả về JSON:
{
  "chunks": [
    { "text": "...", "label": "Mở đầu" },
    { "text": "...", "label": "Nội dung chính" }
  ]
}`;
```

---

## Task 3: Replace CopilotDictionaryModal with PronunciationCheck

### Xóa `src/components/studio/CopilotDictionaryModal.tsx` (không còn ở đường dẫn này)

File đã được move vào `src/features/studio/components/CopilotDictionaryModal.tsx` — xóa nó.

### Tạo `src/components/studio/PronunciationCheck.tsx` (new)

UI component:

- Gọi Gemini → hiển thị danh sách terms
- Mỗi term: highlight word, hiện pronunciation + reason
- Nút "Thêm vào từ điển" bên cạnh mỗi term
- Prop: `{ text: string; dictionary: DictionaryEntry[]; onAddToDictionary: (entry: { word: string; pronunciation: string; priority: number }) => void }`

---

## Task 4: Tạo GrammarFixModal

### `src/components/studio/GrammarFixModal.tsx` (new)

Modal component:

- Gọi Gemini → hiển thị diff (text gốc vs text sửa)
- Danh sách changes bên dưới
- Nút "Áp dụng" → thay text trong textarea
- Nút "Hủy"
- Prop: `{ text: string; onApply: (corrected: string) => void; onClose: () => void }`

---

## Task 5: Tạo SmartChunking

### `src/components/studio/SmartChunking.tsx` (new)

Component:

- Gọi Gemini → hiển thị danh sách chunks với labels
- Checkbox chọn chunk cần generate
- Nút "Generate All" → gọi generate từng chunk tuần tự
- Progress bar hiển thị tiến độ tổng
- Prop: `{ text: string; onGenerateChunk: (chunkText: string, label: string) => Promise<void> }`

---

## Task 6: Update studio/page.tsx

### Thay thế nút "Phân tích từ khó" cũ

- Xóa import `CopilotDictionaryModal`, `extractTerms`
- Xóa state `extractedTerms`, `isCopilotOpen`, `isExtracting`
- Xóa `handleExtractTerms`, `handleSaveTerms`
- Thêm 3 nút mới + state cho modal
- Import 3 component mới

---

## Task 7: Cleanup backend

### `backend/app/api/tts.py`

Xóa endpoint `/extract-terms` (dòng ~180-198) + class `TermExtractionRequest`

### `backend/app/services/llm_normalizer.py`

Xóa function `extract_terms()` (dòng ~195-234) + giữ lại `needs_llm_normalization` và `llm_normalize` (dùng cho TTS normalization)

### `frontend/src/features/voice/api/voice-api.ts`

Xóa function `extractTerms()` (dòng ~53-69) + các import liên quan

---

## Task 8: Final verification

```bash
npm run build && npx vitest run
```

---

## Files Changed

| File                                                        | Action                               |
| ----------------------------------------------------------- | ------------------------------------ |
| `package.json`                                              | + `@google/generative-ai`            |
| `src/lib/gemini/client.ts`                                  | New                                  |
| `src/lib/gemini/prompts.ts`                                 | New                                  |
| `src/components/studio/PronunciationCheck.tsx`              | New                                  |
| `src/components/studio/GrammarFixModal.tsx`                 | New                                  |
| `src/components/studio/SmartChunking.tsx`                   | New                                  |
| `src/features/studio/components/CopilotDictionaryModal.tsx` | Delete                               |
| `src/features/studio/components/index.ts`                   | Remove CopilotDictionaryModal export |
| `src/features/studio/index.ts`                              | Remove CopilotDictionaryModal export |
| `src/app/studio/page.tsx`                                   | Replace old button, add 3 new        |
| `src/features/voice/api/voice-api.ts`                       | Remove extractTerms                  |
| `backend/app/api/tts.py`                                    | Remove extract-terms endpoint        |
| `backend/app/services/llm_normalizer.py`                    | Remove extract_terms()               |
