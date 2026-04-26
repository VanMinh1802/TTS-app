# Emotion Tags Implementation Plan

**Goal:** Add auto-tagging emotion feature to TTS app - users can type `(Cảm xúc)` in text to apply emotion to speech synthesis.

**Architecture:** Frontend parser + Emotion Dictionary Service + Backend API for custom user emotions. TTS worker receives emotion params and applies to Piper ONNX model.

**Tech Stack:** Next.js (frontend), FastAPI (backend), Piper ONNX (TTS), SQLAlchemy (DB)

---

> **Spec:** .sdlc/SPEC007-frontend-emotion-tags/spec.md
> **Status:** Draft | Review | Approved
> **Author:** Developer
> **Date:** 2026-04-22

---

## 1. Architecture Overview

### 1.1 System Context

```
User Input: "(Ngạc nhiên) Ơ... An?"
        ↓
Frontend Parser (Regex)
        ↓
Emotion Dictionary Lookup (Exact → Keyword → Fuzzy)
        ↓
Chunk: { emotion: "ngạc nhiên", text: "Ơ... An?", params: {...} }
        ↓
TTS Worker (Piper ONNX) + Emotion Params
        ↓
Audio Output
```

### 1.2 Component Interaction

```
SegmentEditor (UI)
    ↓ text + emotion_tags
EmotionParser (lib/tts/emotion-parser.ts)
    ↓ chunks
EmotionDictService (lib/tts/emotion-dict.ts)
    ↓ params
TTSWorkerClient
    ↓ audio chunks
AudioPlayer
```

---

## 2. Tech Stack & Dependencies

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Framework | Next.js | 16+ | Existing frontend |
| Framework | FastAPI | 0.115+ | Existing backend |
| DB | SQLAlchemy | 2.0+ | Existing ORM |
| Fuzzy | fuse.js | ^7.0 | Lightweight fuzzy search |
| Editor | react-simple-code-editor | ^1.0 | Lightweight syntax highlight |

### 2.1 New Dependencies

- `fuse.js`: Fuzzy search cho fallback matching
- `react-simple-code-editor`: Editor với syntax highlighting (thay thế textarea)

### 2.2 Existing Modules Used (read-only)

- `frontend/src/lib/tts/worker-client.ts`: TTS generation
- `backend/app/models/project.py`: Segment model
- `backend/app/schemas/project.py`: Segment schemas

---

## 3. Data Model

### 3.1 Schema Design

**Table: `segments`** (update)

| Column | Type | Nullable | Index | Notes |
|--------|------|----------|-------|-------|
| `emotion_params` | jsonb | Yes | | Per-segment emotion config |

**Table: `user_emotion_dicts`** (new)

| Column | Type | Nullable | Index | Notes |
|--------|------|----------|-------|-------|
| `id` | uuid | No | PK | |
| `user_id` | uuid | No | FK | References users.id |
| `emotion_key` | varchar(50) | No | | e.g., "ngạc nhiên" |
| `length_scale` | float | No | | Default 1.0 |
| `noise_scale` | float | No | | Default 0.667 |
| `created_at` | timestamp | No | | |

### 3.2 Relationships

- `users` 1:N `user_emotion_dicts` via `user_id`

### 3.3 Migration Strategy

- [ ] Add `emotion_params` column to `segments` table (JSONB)
- [ ] Create `user_emotion_dicts` table

---

## 4. API Contracts

### 4.1 Endpoints

**GET /api/v1/users/me/emotion-dict**

| Aspect | Detail |
|--------|--------|
| Auth | Required |
| Response 200 | `{ "data": [{ "emotion": "ngạc nhiên", "length_scale": 0.8, "noise_scale": 0.8 }] }` |

**PUT /api/v1/users/me/emotion-dict/{emotion_key}**

| Aspect | Detail |
|--------|--------|
| Auth | Required |
| Request Body | `{ "length_scale": 0.8, "noise_scale": 0.8 }` |
| Response 200 | `{ "data": { "emotion": "ngạc nhiên", "length_scale": 0.8, "noise_scale": 0.8 } }` |

**DELETE /api/v1/users/me/emotion-dict/{emotion_key}**

| Aspect | Detail |
|--------|--------|
| Auth | Required |
| Response 200 | `{ "success": true }` |

---

## 5. Internal Service Design

### 5.1 Emotion Parser (Frontend)

```typescript
// Factory signature
export const createEmotionParser = () => ({
  parse: (text: string) => ParsedChunk[],
  parseSync: (text: string) => ParsedChunk[], // For real-time preview
})

interface ParsedChunk {
  emotion: string;      // "ngạc nhiên"
  text: string;         // "Ơ... An?"
  startIndex: number;   // For highlighting
  endIndex: number;     // For highlighting
}
```

### 5.2 Emotion Dictionary Service (Frontend)

```typescript
// Factory signature
export const createEmotionDictService = (userDicts?: UserEmotionDict[]) => ({
  lookup: (emotion: string) => EmotionParams | null,
  getAll: () => Record<string, EmotionParams>,
  merge: (userDicts: UserEmotionDict[]) => EmotionParams,
})

interface EmotionParams {
  length_scale: number;
  noise_scale: number;
}

// Default emotions
const DEFAULT_EMOTIONS: Record<string, EmotionParams> = {
  "ngạc nhiên": { length_scale: 0.8, noise_scale: 0.8 },
  "vui": { length_scale: 0.9, noise_scale: 0.7 },
  "cười": { length_scale: 0.9, noise_scale: 0.7 },
  "buồn": { length_scale: 1.3, noise_scale: 0.3 },
  "tức giận": { length_scale: 0.85, noise_scale: 0.9 },
  "sợ hãi": { length_scale: 0.8, noise_scale: 0.9 },
  "ghê tởm": { length_scale: 0.9, noise_scale: 0.85 },
  "khinh miệt": { length_scale: 0.85, noise_scale: 0.8 },
  "im lặng": { length_scale: 1.5, noise_scale: 0.2 },
  "thì thầm": { length_scale: 1.2, noise_scale: 0.3 },
  "bình thường": { length_scale: 1.0, noise_scale: 0.667 },
}
```

### 5.3 Keyword Mapping (Fallback Step 2)

```typescript
const KEYWORD_MAP: Record<string, string> = {
  "vui vẻ": "vui",
  "hân hoan": "cười",
  "mừng": "cười",
  "phấn khích": "cười",
  "buồn bã": "buồn",
  "đau buồn": "buồn",
  "tuyệt vọng": "buồn",
  "nổi giận": "tức giận",
  "giận": "tức giận",
  "hoảng sợ": "sợ hãi",
  "kinh hoàng": "sợ hãi",
  "ghét": "ghê tởm",
  "khinh": "khinh miệt",
  "lặng": "im lặng",
  "trầm": "im lặng",
  "nói nhỏ": "thì thầm",
  "thầm": "thì thầm",
  "bình thường": "bình thường",
  "normal": "bình thường",
  "default": "bình thường",
}
```

### 5.4 Fuzzy Match (Fallback Step 3)

```typescript
import Fuse from 'fuse.js';

const fuse = new Fuse(Object.keys(DEFAULT_EMOTIONS), {
  threshold: 0.4,
  includeScore: true,
});

function fuzzyLookup(input: string): string | null {
  const results = fuse.search(input);
  if (results.length > 0) {
    return results[0].item;
  }
  return null;
}
```

---

## 6. Error Handling

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| INVALID_EMOTION | 400 | Emotion key không hợp lệ | "Emotion not found" |
| DB_ERROR | 500 | Database unavailable | Dùng default dict |

---

## 7. Test Strategy

### 7.1 RED-GREEN-REFACTOR per Task

Each task follows: RED (write failing test) → GREEN (minimal code) → REFACTOR

### 7.2 Task List

```markdown
### Task 1: Create Emotion Parser

**Files:** `frontend/src/lib/tts/emotion-parser.ts`, `frontend/src/lib/tts/emotion-parser.test.ts`

---

**[RED]** Write failing test:

```typescript
// frontend/src/lib/tts/emotion-parser.test.ts
import { parseEmotionTags } from './emotion-parser';

test('TC-01: Parse single emotion tag', () => {
  const result = parseEmotionTags('(Ngạc nhiên) Ơ... An?');
  expect(result).toEqual([
    { emotion: 'ngạc nhiên', text: 'Ơ... An?', startIndex: 0, endIndex: 14 }
  ]);
});

test('TC-02: Parse multiple emotion tags', () => {
  const result = parseEmotionTags('(Ngạc nhiên) Ơ... An? (Cười) Lâu quá.');
  expect(result).toEqual([
    { emotion: 'ngạc nhiên', text: 'Ơ... An?', startIndex: 0, endIndex: 14 },
    { emotion: 'cười', text: 'Lâu quá.', startIndex: 16, endIndex: 26 }
  ]);
});

test('TC-03: Handle text without emotion', () => {
  const result = parseEmotionTags('Chào bạn, hôm nay trời đẹp.');
  expect(result).toEqual([
    { emotion: 'bình thường', text: 'Chào bạn, hôm nay trời đẹp.', startIndex: 0, endIndex: 25 }
  ]);
});
```

**[RED]** Run: `npm test frontend/src/lib/tts/emotion-parser.test.ts`
**Expected:** FAIL — "Cannot find module"

**[GREEN]** Write minimal implementation:

```typescript
// frontend/src/lib/tts/emotion-parser.ts
export interface ParsedChunk {
  emotion: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

const EMOTION_TAG_REGEX = /\(([^)]+)\)/g;

export function parseEmotionTags(text: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  let lastIndex = 0;
  let match;

  while ((match = EMOTION_TAG_REGEX.exec(text)) !== null) {
    const emotion = match[1].toLowerCase().trim();
    const tagEndIndex = match.index + match[0].length;
    
    // Find next tag or end of text
    const nextTagMatch = EMOTION_TAG_REGEX.exec(text);
    EMOTION_TAG_REGEX.lastIndex = match.index; // Reset regex state
    
    let textContent: string;
    if (nextTagMatch) {
      textContent = text.slice(tagEndIndex, nextTagMatch.index).trim();
    } else {
      textContent = text.slice(tagEndIndex).trim();
    }
    
    if (textContent) {
      chunks.push({
        emotion,
        text: textContent,
        startIndex: match.index,
        endIndex: match.index + match[0].length + textContent.length
      });
    }
    
    lastIndex = tagEndIndex;
  }
  
  // If no emotion tags found, return entire text as default
  if (chunks.length === 0 && text.trim()) {
    chunks.push({
      emotion: 'bình thường',
      text: text.trim(),
      startIndex: 0,
      endIndex: text.length
    });
  }
  
  return chunks;
}
```

**[GREEN]** Run: `npm test frontend/src/lib/tts/emotion-parser.test.ts`
**Expected:** PASS

**[REFACTOR]** Clean up regex state handling if needed.
```

---

### Task 2: Create Emotion Dictionary Service

**Files:** `frontend/src/lib/tts/emotion-dict.ts`, `frontend/src/lib/tts/emotion-dict.test.ts`

```markdown
**[RED]** Write failing test:

```typescript
// frontend/src/lib/tts/emotion-dict.test.ts
import { createEmotionDictService } from './emotion-dict';

test('TC-04: Exact match lookup', () => {
  const service = createEmotionDictService();
  const result = service.lookup('ngạc nhiên');
  expect(result).toEqual({ length_scale: 0.8, noise_scale: 0.8 });
});

test('TC-05: Keyword map fallback', () => {
  const service = createEmotionDictService();
  const result = service.lookup('vui vẻ');
  expect(result).toEqual({ length_scale: 0.9, noise_scale: 0.7 }); // maps to "vui"
});

test('TC-06: Fuzzy match fallback', () => {
  const service = createEmotionDictService();
  const result = service.lookup('vuiw'); // typo
  expect(result).toEqual({ length_scale: 0.9, noise_scale: 0.7 }); // fuzzy match to "vui"
});

test('TC-07: Return default when no match', () => {
  const service = createEmotionDictService();
  const result = service.lookup('xyznonexistent');
  expect(result).toEqual({ length_scale: 1.0, noise_scale: 0.667 }); // default
});
```

**[RED]** Run: `npm test frontend/src/lib/tts/emotion-dict.test.ts`
**Expected:** FAIL

**[GREEN]** Write implementation with DEFAULT_EMOTIONS, KEYWORD_MAP, and fuse.js
```

---

### Task 3: Add Emotion Params to Segment Model

**Files:** `backend/app/models/project.py`, `backend/app/schemas/project.py`

```markdown
**[RED]** Write migration + model update:

1. Add `emotion_params: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)` to Segment model
2. Update SegmentCreate/SegmentUpdate/SegmentResponse schemas
3. Add migration file
```

---

### Task 4: Create Emotion Dictionary API

**Files:** `backend/app/api/routes/emotion_dict.py`, `backend/app/services/emotion_dict_service.py`

```markdown
**[RED]** Write test:

```python
# backend/tests/test_emotion_dict_api.py
def test_get_user_emotion_dict(client, authenticated_user):
    response = client.get("/api/v1/users/me/emotion-dict")
    assert response.status_code == 200
    assert "data" in response.json()
```

**[GREEN]** Implement API endpoints
```

---

### Task 5: Update TTS Worker Client

**Files:** `frontend/src/lib/tts/worker-client.ts`

```markdown
Update TTSWorkerClient.generate() to accept emotion params:

```typescript
interface TTSOptions {
  voiceId: string;
  sampleRate?: number;
  speed?: number;
  emotionParams?: EmotionParams; // NEW
}
```
```

---

### Task 6: Create Emotion Editor UI Component

**Files:** `frontend/src/components/studio/EmotionEditor.tsx`

```markdown
- Replace textarea with react-simple-code-editor
- Add syntax highlighting for emotion tags
- Add EmotionSettingsPanel component
```

---

### Task 7: Integrate Emotion Parsing in Segment Editor

**Files:** `frontend/src/app/project/[id]/page.tsx`, `frontend/src/components/project/SegmentEditor.tsx`

```markdown
- Parse emotion tags when saving segment
- Store emotion_params in segment data
- Pass emotion_params to TTS worker on generate
```

---

## 8. Constraints & Trade-offs

### 8.1 Constraints

- Must follow AGENTS.md conventions
- Emotion tag syntax: `(Tên cảm xúc)` - exactly parentheses
- Max 10 emotions in default dict to keep UI simple

### 8.2 Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|----------------|
| Client-side parsing | Server-side parsing | Real-time preview, no API latency |
| Hardcoded defaults | All DB | Simpler, faster initial load |
| Fuse.js fuzzy | Levenshtein native | Better Vietnamese support |

### 8.3 Out of Scope (Technical)

- SSML editor integration
- Multi-language emotion mapping
- Real-time voice preview while editing emotions

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-04-22 | v1.0 | Developer | Initial plan | — | All |

### Follow-ups

| Date | Item | Impact | Status |
|------|------|--------|--------|
| | | | Pending |

### Change Rules

1. Every change logged with version bump
2. Follow-ups section captures implementation discoveries
3. When follow-ups require code changes → implement directly
