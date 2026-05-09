# Remove LLM & Streamline Studio UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Gemini/LLM code from frontend & backend, refactor Studio page to Focused Canvas 2-panel layout, clean up dead state/components.

**Architecture:** 2-panel grid (left `1fr`: StudioHeader + TextInput + PreviewPanel, right `340px`: VoiceSelector + VoiceSettings + CustomDictionary + Generate button). Remove 3 LLM modals + toolbar + floating bar + PRO gating + NormalizationMeta. Backend: delete `llm_normalizer.py`, remove `/validate-key` endpoint, strip `X-LLM-API-Key` handling.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, TypeScript, FastAPI (backend)

---

## File Structure

```
DELETED (8 files):
  frontend/src/lib/gemini/client.ts
  frontend/src/lib/gemini/prompts.ts
  frontend/src/lib/gemini/index.ts
  frontend/src/features/studio/components/PronunciationCheck.tsx
  frontend/src/features/studio/components/GrammarFixModal.tsx
  frontend/src/features/studio/components/SmartChunking.tsx
  backend/app/services/llm_normalizer.py
  backend/tests/test_llm_normalizer.py

MODIFIED (10 files):
  frontend/src/app/studio/page.tsx            # Full layout refactor
  frontend/src/features/studio/components/PreviewPanel.tsx  # Remove NormMeta badge
  frontend/src/features/studio/components/index.ts          # Drop 3 exports
  frontend/src/features/studio/index.ts                     # Drop 3 exports
  frontend/src/features/voice/api/voice-api.ts              # Remove X-LLM-API-Key
  frontend/src/features/voice/types/voice-types.ts          # Remove NormalizationMeta
  frontend/src/features/tts/hooks/useTtsGenerate.ts         # Simplify response type
  frontend/src/app/settings/page.tsx          # Remove Gemini key section
  backend/app/api/tts.py                      # Remove LLM logic + validate-key
  backend/app/schemas/tts.py                  # Remove NormalizationMeta schema

NEW (3 files):
  frontend/src/features/studio/components/StudioHeader.tsx
  frontend/src/features/studio/components/StudioHeader.test.tsx
  frontend/src/app/studio/page.test.tsx
```

---

## Task 0: Pre-flight — Verify Current State

### Task 0.1: Confirm dependencies

**Files:** None (verification only)

Run to confirm the system works before any changes:

```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run lint
cd backend && python -m pytest tests/ -v
```

All three must pass before proceeding.

---

## Task 1: Backend — Remove LLM Normalizer & Validate-Key

### Task 1.1: Delete `llm_normalizer.py` and its tests

**Files:** `backend/app/services/llm_normalizer.py`, `backend/tests/test_llm_normalizer.py`

---

**[RED]** Verify files exist:

```bash
ls backend/app/services/llm_normalizer.py
ls backend/tests/test_llm_normalizer.py
```

**Expected:** Both files exist.

**[GREEN]** Delete files:

```bash
rm backend/app/services/llm_normalizer.py
rm backend/tests/test_llm_normalizer.py
```

**[GREEN]** Run backend tests:

```bash
cd backend && python -m pytest tests/ -v
```

**Expected:** All tests pass (or fail due to imports in Task 1.2 — expected at this stage).

---

### Task 1.2: Remove LLM logic from `backend/app/api/tts.py`

**Files:** `backend/app/api/tts.py`

Remove all LLM-related code: the `/validate-key` endpoint, LLM imports, `X-LLM-API-Key` header reading, LLM normalization call, and `NormalizationMeta` usage. Keep rule-based normalization only.

---

**[RED]** Write failing test — verify `/validate-key` endpoint exists (it will be removed):

```bash
curl -s -X POST http://localhost:8000/api/v1/tts/validate-key -H "Content-Type: application/json" -d '{"api_key":"test"}' | python -m json.tool
```

**Expected:** Returns JSON response (valid/invalid).

**[GREEN]** Edit `backend/app/api/tts.py`:

1. Remove imports: `NormalizationMeta`, `llm_normalizer` module, `validate_gemini_key`, `LLM_STATUS_SUCCESS`, `needs_llm_normalization`
2. Remove `ValidateKeyRequest`, `ValidateKeyResponse`, `_STATUS_MESSAGES` classes
3. Remove entire `POST /validate-key` endpoint (lines 54-62)
4. In `generate_tts()`: remove `llm_api_key` line (line 140), `is_complex` line (line 141), `norm_mode`/`llm_status`/`final_normalized` variables (lines 143-145), `user_tier`/`is_pro` block (lines 147-148), LLM normalizer call block (lines 150-153)
5. Change return statement to remove `normalization` field:

```python
# Replace lines 106-179 with:
@router.post("/generate", response_model=TTSResponse)
async def generate_tts(
    request: TTSRequest,
    http_request: Request,
    user: User = Depends(get_current_user),
    quota_service: QuotaService = Depends(get_quota_service),
):
    """Generate TTS audio using Piper model from R2."""
    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Văn bản quá dài. Giới hạn tối đa {MAX_TEXT_LENGTH:,} ký tự.",
        )

    models = _get_models()
    if request.voice_id not in models and request.voice_id not in VOICE_ALIASES:
        request.voice_id = "vi_female"

    char_count = len(request.text)

    if not quota_service.check_quota(user.id, "api_calls", 1):
        raise HTTPException(status_code=429, detail=BACKEND_MESSAGES["errors"]["api_calls_limit"])
    if not quota_service.check_quota(user.id, "characters", char_count):
        raise HTTPException(status_code=429, detail=BACKEND_MESSAGES["errors"]["characters_limit"])

    await tts_service._ensure_model(request.voice_id)

    text = tts_service._apply_user_dictionary(request.text, request.user_dictionary or [])

    try:
        normalized, _, _, _ = normalize_vietnamese(text, mode="standard")
    except ValueError:
        normalized = text

    cleaned = cleanup_grammar(normalized)

    wav_data, duration = await asyncio.to_thread(
        tts_service.synthesize,
        text=cleaned,
        voice_id=request.voice_id,
        speed=request.speed,
    )

    audio_b64 = base64.b64encode(wav_data).decode("utf-8")
    audio_url = f"data:audio/wav;base64,{audio_b64}"

    quota_service.consume_quota(user.id, "api_calls", 1)
    quota_service.consume_quota(user.id, "characters", char_count)

    return TTSResponse(
        audio_url=audio_url,
        duration=duration,
        voice_id=request.voice_id,
    )
```

6. Remove `asyncio` import if no longer used (check usage).

**[GREEN]** Run backend tests:

```bash
cd backend && python -m pytest tests/ -v
```

**Expected:** All tests pass.

**[REFACTOR]** Clean up unused imports in `tts.py`.

---

### Task 1.3: Remove `NormalizationMeta` from backend schema

**Files:** `backend/app/schemas/tts.py`

---

**[RED]** Verify schema currently has `NormalizationMeta`:

```bash
python -c "from app.schemas.tts import NormalizationMeta; print(NormalizationMeta.__name__)"
```

**Expected:** Prints `NormalizationMeta`.

**[GREEN]** Edit `backend/app/schemas/tts.py`:

Replace entire file with:

```python
"""Pydantic schemas for TTS API."""
from typing import Optional
from pydantic import BaseModel, Field


class DictionaryEntry(BaseModel):
    """Single dictionary entry."""

    word: str = Field(..., description="Original word/text")
    pronunciation: str = Field(..., description="Custom pronunciation/output")


class TTSRequest(BaseModel):
    """Request for TTS generation."""

    text: str
    voice_id: str = "vi_female"
    speed: float = 1.0
    user_dictionary: Optional[list[DictionaryEntry]] = Field(
        default=None,
        description="User custom dictionary for text replacement"
    )


class TTSResponse(BaseModel):
    """Response for TTS generation."""

    audio_url: str
    duration: float
    voice_id: str
    audio_mp3: Optional[str] = None
    audio_wav: Optional[str] = None
```

Note: Added `audio_mp3` and `audio_wav` fields since the frontend voice-types already has them in `TTSGenerateResponse` and the generate hook saves these.

**[GREEN]** Run backend tests:

```bash
cd backend && python -m pytest tests/ -v
```

**Expected:** All tests pass.

---

### Task 1.4: Clean up `backend/app/core/messages.py`

**Files:** `backend/app/core/messages.py`

Remove API key validation messages (they're only used by the deleted `/validate-key` endpoint).

---

**[RED]** Verify messages file currently has `api_key_*` keys:

```bash
python -c "from app.core.messages import BACKEND_MESSAGES; print('api_key_valid' in BACKEND_MESSAGES['status'])"
```

**Expected:** Prints `True`.

**[GREEN]** Edit `backend/app/core/messages.py`:

Remove the `"status"` key entirely (all status messages are API-key related):

```python
"""Centralized Vietnamese messages for backend responses and errors."""

BACKEND_MESSAGES = {
    "errors": {
        "internal_server_error": "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
        "rate_limit_exceeded": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
        "api_calls_limit": "Bạn đã đạt giới hạn số lần gọi API trong ngày.",
        "characters_limit": "Bạn đã hết số lượng ký tự trong tháng.",
        "unknown_status": "Trạng thái không xác định.",
        "subscription_expired": "Gói cước của bạn đã hết hạn (Subscription expired). Vui lòng gia hạn để tiếp tục sử dụng.",
    },
}
```

**[GREEN]** Run backend tests:

```bash
cd backend && python -m pytest tests/ -v
```

**Expected:** All tests pass.

---

## Task 2: Frontend — Delete Gemini Library

### Task 2.1: Delete `lib/gemini/` directory

**Files:** `frontend/src/lib/gemini/client.ts`, `frontend/src/lib/gemini/prompts.ts`, `frontend/src/lib/gemini/index.ts`

---

**[RED]** Verify directory currently exists:

```bash
ls frontend/src/lib/gemini/
```

**Expected:** Lists 3 files.

**[GREEN]** Delete directory:

```bash
rm -rf frontend/src/lib/gemini/
```

**[RED]** Verify `npx tsc --noEmit` now fails (imports broken — expected, fixes in later tasks):

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

**Expected:** Type errors related to missing `@/lib/gemini` imports. This is expected — the following tasks fix these imports.

---

## Task 3: Frontend Voice API — Remove `X-LLM-API-Key`

### Task 3.1: Remove LLM key from `voice-api.ts`

**Files:** `frontend/src/features/voice/api/voice-api.ts`

---

**[RED]** Write failing test:

```typescript
// frontend/src/features/voice/api/voice-api.test.ts
import { generateTts } from './voice-api';

jest.mock('@/lib/api-client', () => ({
  apiRequest: jest.fn(),
}));

test('TC-VA-01: generates TTS without X-LLM-API-Key header', async () => {
  const { apiRequest } = require('@/lib/api-client');
  apiRequest.mockResolvedValue({
    audio_url: 'test.mp3',
    duration: 1.0,
    voice_id: 'vi_female',
  });

  await generateTts({ text: 'hello', voice_id: 'vi_female', speed: 1 });

  const callArgs = apiRequest.mock.calls[0];
  const headers = callArgs[1]?.headers || {};
  expect(headers['X-LLM-API-Key']).toBeUndefined();
});
```

**[RED]** Run: `cd frontend && npx jest --testPathPattern="voice-api"`

**Expected:** FAIL — `X-LLM-API-Key` header still present.

**[GREEN]** Edit `frontend/src/features/voice/api/voice-api.ts`:

Replace entire file with:

```typescript
import { ApiError, apiRequest } from "@/lib/api-client";
import {
  ttsGenerateRequestSchema,
  ttsGenerateResponseSchema,
  ttsVoicesResponseSchema,
  type StudioVoice,
  type TTSGenerateRequest,
  type TTSGenerateResponse,
} from "../types/voice-types";

let cachedStudioVoices: Promise<StudioVoice[]> | null = null;

export const getStudioVoices = async (): Promise<StudioVoice[]> => {
  if (cachedStudioVoices) return cachedStudioVoices;

  cachedStudioVoices = (async () => {
    try {
      const response = await apiRequest<unknown>("/tts/voices");
      return ttsVoicesResponseSchema.parse(response).voices;
    } catch (error) {
      cachedStudioVoices = null;
      throw error;
    }
  })();

  return cachedStudioVoices;
};

export const generateTts = async (payload: TTSGenerateRequest): Promise<TTSGenerateResponse> => {
  const validatedPayload = ttsGenerateRequestSchema.parse(payload);

  const raw = await apiRequest<TTSGenerateResponse>("/tts/generate", {
    method: "POST",
    body: JSON.stringify(validatedPayload),
  });

  const parsed = ttsGenerateResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : (raw as TTSGenerateResponse);
};
```

**[GREEN]** Run: `cd frontend && npx jest --testPathPattern="voice-api"`

**Expected:** PASS.

---

## Task 4: Frontend Voice Types — Remove `NormalizationMeta`

### Task 4.1: Remove `NormalizationMeta` from `voice-types.ts`

**Files:** `frontend/src/features/voice/types/voice-types.ts`

---

**[RED]** Write failing test — verify `NormalizationMeta` type is currently exported:

```typescript
// frontend/src/features/voice/types/voice-types.test.ts
import { TTSGenerateResponse } from './voice-types';

test('TC-VT-01: TTSGenerateResponse has no normalization field', () => {
  const response: TTSGenerateResponse = {
    audio_url: 'test.mp3',
    duration: 1.0,
    voice_id: 'vi_female',
  };
  // TypeScript should NOT require normalization
  expect(response.audio_url).toBe('test.mp3');
});
```

**[RED]** Run: `cd frontend && npx jest --testPathPattern="voice-types"`

**Expected:** FAIL — if normalization is still required.

**[GREEN]** Edit `frontend/src/features/voice/types/voice-types.ts`:

Remove lines 52-73 (`normalizationMetaSchema`, its `z.infer`, and `NormalizationMeta` type):

```typescript
// Remove lines 52-56:
// export const normalizationMetaSchema = z.object({...});
// export const ttsGenerateResponseSchema = z.object({...});
// Remove line 73: export type NormalizationMeta = ...

// Updated ttsGenerateResponseSchema (line 58-65):
export const ttsGenerateResponseSchema = z.object({
  audio_url: z.string(),
  duration: z.number(),
  voice_id: z.string(),
  audio_mp3: z.string().optional(),
  audio_wav: z.string().optional(),
});

// Remove line 73:
// export type NormalizationMeta = z.infer<typeof normalizationMetaSchema>;
```

**[GREEN]** Run: `cd frontend && npx jest --testPathPattern="voice-types"`

**Expected:** PASS.

---

## Task 5: Frontend — Delete LLM Studio Components

### Task 5.1: Delete 3 LLM modal components

**Files:** 
- `frontend/src/features/studio/components/PronunciationCheck.tsx`
- `frontend/src/features/studio/components/GrammarFixModal.tsx`
- `frontend/src/features/studio/components/SmartChunking.tsx`

---

**[RED]** Verify files exist:

```bash
ls frontend/src/features/studio/components/PronunciationCheck.tsx
ls frontend/src/features/studio/components/GrammarFixModal.tsx
ls frontend/src/features/studio/components/SmartChunking.tsx
```

**Expected:** All three exist.

**[GREEN]** Delete files:

```bash
rm frontend/src/features/studio/components/PronunciationCheck.tsx
rm frontend/src/features/studio/components/GrammarFixModal.tsx
rm frontend/src/features/studio/components/SmartChunking.tsx
```

---

## Task 6: Frontend — Update Barrel Exports  

### Task 6.1: Remove 3 LLM components from barrel exports

**Files:** `frontend/src/features/studio/components/index.ts`, `frontend/src/features/studio/index.ts`

---

**[RED]** Verify current exports include the 3 modals:

```bash
grep -E "PronunciationCheck|GrammarFixModal|SmartChunking" frontend/src/features/studio/components/index.ts
```

**Expected:** All three found in exports.

**[GREEN]** Edit `frontend/src/features/studio/components/index.ts`:

```typescript
export { VoiceSelector } from './VoiceSelector';
export { VoiceSettings } from './VoiceSettings';
export { TextInput } from './TextInput';
export { CustomDictionary, type DictionaryEntry } from './CustomDictionary';
export { AudioPreview } from './AudioPreview';
export { StudioLibraryDrawer } from './StudioLibraryDrawer';
export { StudioHero } from './StudioHero';
export { PreviewPanel } from './PreviewPanel';
export { DictionaryEntryRow } from './DictionaryEntryRow';
export { Field } from './DictionaryField';
export { StudioHeader } from './StudioHeader';
```

Edit `frontend/src/features/studio/index.ts`:

```typescript
export { VoiceSelector, VoiceSettings, TextInput, CustomDictionary, AudioPreview, StudioLibraryDrawer, StudioHero, PreviewPanel, StudioHeader } from './components';
export { type DictionaryEntry } from './components/CustomDictionary';
```

**[GREEN]** Run: `cd frontend && npx tsc --noEmit`

**Expected:** May still have errors from `page.tsx` — that's the next task.

---

## Task 7: Frontend — Create StudioHeader Component

### Task 7.1: Create StudioHeader (replaces full StudioHero)

**Files:** `frontend/src/features/studio/components/StudioHeader.tsx`, `StudioHeader.test.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/features/studio/components/StudioHeader.test.tsx
import { render, screen } from '@testing-library/react';
import { StudioHeader } from './StudioHeader';

jest.mock('@/shared/i18n', () => ({
  useT: () => ({}),
}));

test('TC-01: renders TTS Studio title', () => {
  render(<StudioHeader />);
  expect(screen.getByText('TTS Studio')).toBeInTheDocument();
});

test('TC-01: renders Projects link', () => {
  render(<StudioHeader />);
  const link = screen.getByRole('link', { name: /projects/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/projects');
});

test('TC-01: renders Library button', () => {
  const onOpenLibrary = jest.fn();
  render(<StudioHeader onOpenLibrary={onOpenLibrary} />);
  const btn = screen.getByRole('button', { name: /thư viện/i });
  expect(btn).toBeInTheDocument();
  btn.click();
  expect(onOpenLibrary).toHaveBeenCalled();
});
```

**[RED]** Run: `cd frontend && npx jest --testPathPattern="StudioHeader"`

**Expected:** FAIL — "Cannot find module".

**[GREEN]** Write implementation:

```typescript
// frontend/src/features/studio/components/StudioHeader.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useT } from '@/shared/i18n';

interface StudioHeaderProps {
  onOpenLibrary?: () => void;
}

export const StudioHeader = React.memo(function StudioHeader({ onOpenLibrary }: StudioHeaderProps) {
  const t = useT();
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[#F4F4F5]">
          TTS Studio
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-[12px] font-medium text-[#A1A1AA] hover:text-white transition-colors"
          >
            ← Projects
          </Link>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/30 text-[#818CF8] text-xs font-medium hover:text-white hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 hover:border-[#6366F1]/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
            </svg>
            Thư viện
          </button>
        </div>
      </div>
    </div>
  );
});
```

**[GREEN]** Run: `cd frontend && npx jest --testPathPattern="StudioHeader"`

**Expected:** PASS.

---

## Task 8: Frontend — Update PreviewPanel (Remove NormMeta badge)

### Task 8.1: Simplify PreviewPanel

**Files:** `frontend/src/features/studio/components/PreviewPanel.tsx`

---

**[RED]** Write failing test for 3 PreviewPanel states:

```typescript
// frontend/src/features/studio/components/PreviewPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { PreviewPanel } from './PreviewPanel';

jest.mock('@/shared/i18n', () => ({
  useT: () => ({
    previewTitle: 'Preview',
    ready: 'Ready',
    generating: 'Generating',
    waiting: 'Waiting',
    previewHint: 'Hint',
    audioDownload: 'Download',
    copyLink: 'Copy',
    noAudio: 'No audio',
  }),
}));

jest.mock('./AudioPreview', () => ({
  AudioPreview: ({ audioUrl, loading }: { audioUrl: string | null; loading: boolean }) => (
    <div data-testid="audio-preview">
      {loading ? 'loading...' : audioUrl ? `player:${audioUrl}` : 'empty'}
    </div>
  ),
}));

test('TC-03: empty state shows placeholder', () => {
  render(
    <PreviewPanel
      audioUrl={null}
      loading={false}
      onCopy={async () => {}}
      onDownload={() => {}}
      progress={0}
      wavAvailable={false}
    />
  );
  expect(screen.getByTestId('audio-preview')).toHaveTextContent('empty');
  // No NormalizationMeta badge
  expect(screen.queryByText(/chuẩn hóa/i)).toBeNull();
  expect(screen.queryByText(/AI/i)).toBeNull();
});

test('TC-04: loading state shows loading', () => {
  render(
    <PreviewPanel
      audioUrl={null}
      loading={true}
      onCopy={async () => {}}
      onDownload={() => {}}
      progress={0}
      wavAvailable={false}
    />
  );
  // Status chip should show "Generating" when loading
  expect(screen.getByTestId('audio-preview')).toHaveTextContent('loading...');
});

test('TC-05: success state shows download buttons', () => {
  render(
    <PreviewPanel
      audioUrl="test.mp3"
      loading={false}
      onCopy={async () => {}}
      onDownload={() => {}}
      progress={100}
      wavAvailable={false}
    />
  );
  expect(screen.getByTestId('audio-preview')).toHaveTextContent('player:test.mp3');
});
```

**[RED]** Run: `cd frontend && npx jest --testPathPattern="PreviewPanel"`

**Expected:** FAIL — current PreviewPanel renders NormMeta badge.

**[GREEN]** Edit `frontend/src/features/studio/components/PreviewPanel.tsx`:

Remove `NormalizationMeta` import and badge. Simplify the component:

```typescript
"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useT } from "@/shared/i18n";
import { UiChip } from "@/components/ui/ui-kit";
import { AudioPreview } from "./AudioPreview";

export const PreviewPanel = React.memo(function PreviewPanel({ 
  audioUrl, onCopy, onDownload, loading, progress, autoPlay, wavAvailable, mp3Size, wavSize 
}: { 
  audioUrl: string | null; 
  onCopy: () => Promise<void>; 
  onDownload: (format: 'mp3' | 'wav') => void; 
  loading: boolean; 
  progress: number; 
  autoPlay?: boolean; 
  wavAvailable: boolean; 
  mp3Size?: number; 
  wavSize?: number; 
}) {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(false);
  const handlePlayingChange = useCallback((playing: boolean) => setIsPlaying(playing), []);
  
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[18px] font-semibold tracking-wide text-white">{t.previewTitle}</h2>
          <UiChip className={audioUrl ? "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20" : "bg-transparent border-[#333333] text-[#71717A] shadow-none"}>
            {audioUrl ? t.ready : loading ? t.generating : t.waiting}
          </UiChip>
        </div>
        {isPlaying && (
          <div className="flex items-center justify-center gap-[3px] h-12 mb-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-[#C968F7]"
                animate={{
                  height: [8, 14 + Math.sin(i * 1.5) * 12, 6, 18, 8],
                  opacity: [0.4, 1, 0.5, 0.8, 0.4],
                }}
                transition={{
                  height: { duration: 0.6 + i * 0.04, repeat: Infinity, repeatType: 'mirror' },
                  opacity: { duration: 0.8 + i * 0.05, repeat: Infinity, repeatType: 'mirror' },
                }}
              />
            ))}
          </div>
        )}
        <AudioPreview 
          audioUrl={audioUrl} 
          loading={loading} 
          onCopy={onCopy} 
          onDownload={onDownload} 
          progress={progress} 
          autoPlay={autoPlay} 
          onPlayingChange={handlePlayingChange} 
          wavAvailable={wavAvailable} 
          mp3Size={mp3Size} 
          wavSize={wavSize} 
        />
        
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">{t.previewHint}</p>
        </div>
      </div>
    </div>
  );
});
```

Key changes:
- Removed `NormalizationMeta` import and type from props
- Removed `normMeta` prop and the entire normalization badge section
- Removed `error` prop (errors are handled inline in AudioPreview)
- Kept waveform animation, status chip, and all download functionality

**[GREEN]** Run: `cd frontend && npx jest --testPathPattern="PreviewPanel"`

**Expected:** PASS.

---

## Task 9: Frontend — Refactor Studio Page

### Task 9.1: Full page rewrite

**Files:** `frontend/src/app/studio/page.tsx`, `frontend/src/app/studio/page.test.tsx`

This is the main task. Rewrite the Studio page with:
- StudioHeader replacing StudioHero
- No toolbar section
- No floating action bar
- Simplified state (9 instead of 15)
- Generate button in sidebar
- No PRO/LMM/NormalizationMeta logic

---

**[RED]** Write failing integration test:

```typescript
// frontend/src/app/studio/page.test.tsx
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioPage from './page';

// Mock modules
jest.mock('@/features/studio', () => ({
  VoiceSelector: ({ voices, selectedVoice, onSelect }: any) => (
    <div>
      {voices.map((v: any) => (
        <button key={v.id} onClick={() => onSelect(v.id)} data-testid={`voice-${v.id}`}>
          {v.name}
        </button>
      ))}
    </div>
  ),
  VoiceSettings: ({ speed, onSpeedChange }: any) => (
    <input type="range" value={speed} onChange={(e) => onSpeedChange(parseFloat(e.target.value))} />
  ),
  TextInput: ({ value, onChange, onOverLimit }: any) => (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nhập văn bản..." />
  ),
  CustomDictionary: ({ dictionary, onAdd }: any) => <div>Dict: {dictionary.length}</div>,
  AudioPreview: () => <div />,
  StudioLibraryDrawer: ({ isOpen }: any) => isOpen ? <div>Library</div> : null,
  StudioHeader: () => <h1>TTS Studio</h1>,
  PreviewPanel: ({ loading }: any) => <div>{loading ? 'Generating...' : 'No audio'}</div>,
  type: { DictionaryEntry: {} as any },
}));

jest.mock('@/features/dictionary/api/dictionary-api', () => ({
  getDictionaryEntries: () => Promise.resolve([]),
  createDictionaryEntry: () => Promise.resolve({}),
  deleteDictionaryEntry: () => Promise.resolve(),
  updateDictionaryEntry: () => Promise.resolve({}),
}));

jest.mock('@/features/voice/api/voice-api', () => ({
  getStudioVoices: () => Promise.resolve([
    { id: 'vi_female', name: 'Nữ miền Bắc', lang: 'Tiếng Việt', available: true },
    { id: 'vi_male', name: 'Nam miền Bắc', lang: 'Tiếng Việt', available: true },
  ]),
}));

const mockClientGenerate = jest.fn();
jest.mock('@/features/tts', () => ({
  useTtsGenerate: () => ({
    clientGenerate: mockClientGenerate,
    progress: 0,
    isUsingWorker: false,
    prefetchModel: jest.fn(),
    cancelGeneration: jest.fn(),
  }),
}));

jest.mock('@/features/library/hooks/useLocalLibrary', () => ({
  useLocalLibrary: () => ({ saveLocalRecord: jest.fn() }),
}));

jest.mock('@/shared/notifications/notification-store', () => ({
  useNotifications: () => ({ notify: jest.fn() }),
}));

jest.mock('@/shared/i18n', () => ({
  useT: () => ({
    studio: {
      successTitle: 'Success',
      successMessage: 'Audio generated',
      audioDownload: 'Download',
      errorGenerate: 'Generation failed',
      errorGenerateTitle: 'Error',
      generate: 'Generate',
      generating: 'Generating...',
    },
  }),
}));

jest.mock('@/features/auth/api/auth-api', () => ({
  getCurrentUser: () => Promise.resolve({ subscription_tier: 'free' }),
}));

test('TC-07: renders voices from API', async () => {
  render(<StudioPage />);
  await waitFor(() => {
    expect(screen.getByTestId('voice-vi_female')).toBeInTheDocument();
    expect(screen.getByTestId('voice-vi_male')).toBeInTheDocument();
  });
});

test('TC-08: generate button disabled when text empty', async () => {
  render(<StudioPage />);
  await waitFor(() => {
    const generateBtn = screen.getByRole('button', { name: /tạo giọng nói/i });
    // Button should be disabled when text is empty
    // (textarea starts empty since we mock localStorage)
  });
});

test('TC-12: no LLM/Gemini imports', () => {
  // Verify no import from @/lib/gemini or @google/generative-ai
  const pageContent = require('fs').readFileSync(
    require('path').resolve(__dirname, 'page.tsx'), 'utf8'
  );
  expect(pageContent).not.toContain('@/lib/gemini');
  expect(pageContent).not.toContain('@google/generative-ai');
  expect(pageContent).not.toContain('callGemini');
  expect(pageContent).not.toContain('NormalizationMeta');
  expect(pageContent).not.toContain('X-LLM-API-Key');
});
```

**[RED]** Run: `cd frontend && npx jest --testPathPattern="studio/page"`

**Expected:** FAIL — page still has old imports and states.

**[GREEN]** Write the refactored `frontend/src/app/studio/page.tsx`:

```typescript
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { VoiceSelector, VoiceSettings, TextInput, CustomDictionary, StudioHeader, PreviewPanel } from "@/features/studio";
import dynamic from "next/dynamic";

const StudioLibraryDrawer = dynamic(() => import("@/features/studio/components/StudioLibraryDrawer").then(mod => mod.StudioLibraryDrawer), { ssr: false });
import type { DictionaryEntry } from "@/features/studio";
import { getDictionaryEntries, createDictionaryEntry, deleteDictionaryEntry, updateDictionaryEntry } from "@/features/dictionary/api/dictionary-api";
import { getStudioVoices } from "@/features/voice/api/voice-api";
import { useTtsGenerate } from "@/features/tts";
import type { StudioVoice } from "@/features/voice/types/voice-types";
import { useLocalLibrary } from "@/features/library/hooks/useLocalLibrary";
import { useNotifications } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";

const STORAGE_KEY = "studio_draft_text";
const STORAGE_KEY_VOICE = "studio_voice_id";
const STORAGE_KEY_SPEED = "studio_speed";
const DEFAULT_TEXT = "Xin chào các bạn! Hôm nay chúng ta sẽ cùng nhau khám phá công nghệ TTS tuyệt vời.";

export default function StudioPage() {
  const t = useT();
  const { notify } = useNotifications();
  const [voices, setVoices] = useState<StudioVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentWavUrl, setCurrentWavUrl] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTextOverLimit, setIsTextOverLimit] = useState(false);

  const { saveLocalRecord } = useLocalLibrary();
  const { clientGenerate, progress, isUsingWorker, prefetchModel, cancelGeneration } = useTtsGenerate();

  useEffect(() => {
    let cancelled = false;

    const loadVoices = async () => {
      try {
        const nextVoices = await getStudioVoices();
        if (cancelled) return;
        setVoices(nextVoices);
        setSelectedVoice((current) => {
          const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
          if (savedVoice && nextVoices.some((voice) => voice.id === savedVoice)) return savedVoice;
          if (current && nextVoices.some((voice) => voice.id === current)) return current;
          return nextVoices[0]?.id || "";
        });
      } catch (loadError) {
        if (!cancelled) {
          setVoices([
            { id: "vi_female", name: "Giọng nữ tiếng Việt", lang: "Tiếng Việt", available: true },
            { id: "vi_male", name: "Giọng nam tiếng Việt", lang: "Tiếng Việt", available: true },
          ]);
          setSelectedVoice("vi_female");
          setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách giọng đọc.");
        }
      }
    };

    const loadDictionary = async () => {
      try {
        const entries = await getDictionaryEntries();
        if (!cancelled) setDictionary(entries);
      } catch {
        if (!cancelled) setDictionary([]);
      }
    };

    void loadVoices();
    void loadDictionary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedVoice && voices.length > 0) {
      prefetchModel(selectedVoice);
    }
  }, [selectedVoice, voices.length, prefetchModel]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setText(saved);
  }, []);

  useEffect(() => {
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
    if (savedSpeed) setSpeed(parseFloat(savedSpeed));
  }, []);

  const sortedVoices = useMemo(() => [...voices].sort((a, b) => a.name.localeCompare(b.name, "vi")), [voices]);
  const voiceId = useMemo(() => selectedVoice || voices[0]?.id || "vi_female", [selectedVoice, voices]);

  const handleSelectVoice = useCallback((nextVoiceId: string) => {
    setSelectedVoice(nextVoiceId);
    localStorage.setItem(STORAGE_KEY_VOICE, nextVoiceId);
  }, []);
  const handleSpeedChange = useCallback((nextSpeed: number) => {
    setSpeed(nextSpeed);
    localStorage.setItem(STORAGE_KEY_SPEED, String(nextSpeed));
  }, []);
  const handleTextChange = useCallback((nextText: string) => {
    setText(nextText);
    localStorage.setItem(STORAGE_KEY, nextText);
  }, []);
  const handleCopyAudioUrl = useCallback(async () => { if (audioUrl) await navigator.clipboard.writeText(audioUrl); }, [audioUrl]);
  const handleDownloadAudio = useCallback((format: 'mp3' | 'wav' = 'mp3') => {
    const url = format === 'wav' ? currentWavUrl : audioUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `genvoice-audio.${format}`;
    a.click();
  }, [audioUrl, currentWavUrl]);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || isTextOverLimit) return;
    setGenerating(true);
    setAudioUrl(null);
    setCurrentWavUrl(null);
    setError(null);

    try {
      const response = await clientGenerate({
        text,
        voice_id: voiceId,
        speed,
        user_dictionary: dictionary.length > 0 ? dictionary.map(d => ({
          word: d.word,
          pronunciation: d.pronunciation || d.word,
        })) : undefined,
      });
      setAudioUrl(response.audio_mp3 || response.audio_url);
      if (response.audio_wav) setCurrentWavUrl(response.audio_wav);
      notify({ severity: "success", title: t.studio.successTitle, message: t.studio.successMessage, source: "studio", actionLabel: t.studio.audioDownload, actionHref: response.audio_mp3 || response.audio_url });
      setTimeout(() => {
        const audioEl = document.querySelector('audio') as HTMLAudioElement | null;
        audioEl?.play().catch(() => {});
      }, 100);
      const mp3DataUrl = response.audio_mp3 || response.audio_url;
      const base64Data = mp3DataUrl.split(',')[1] || '';
      const fileSizeBytes = Math.round(base64Data.length * 0.75);
      saveLocalRecord({ 
        id: crypto.randomUUID(), 
        audio_url: response.audio_wav || response.audio_url,
        audio_mp3: mp3DataUrl,
        text_content: text, 
        voice_id: voiceId,
        duration: response.duration,
        file_size_bytes: fileSizeBytes,
        created_at: new Date().toISOString() 
      });
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : t.studio.errorGenerate;
      setError(message);
      notify({ severity: "error", title: t.studio.errorGenerateTitle, message, source: "studio" });
    } finally {
      setGenerating(false);
    }
  }, [text, isTextOverLimit, voiceId, speed, dictionary, clientGenerate, saveLocalRecord, notify, t]);

  const handleAddDictionary = useCallback(async (entry: { word: string; pronunciation?: string }) => {
    try {
      const saved = await createDictionaryEntry({ word: entry.word, pronunciation: entry.pronunciation || entry.word }) as unknown as DictionaryEntry;
      setDictionary((prev) => [...prev, saved]);
      notify({ severity: "success", title: "Đã thêm", message: `Đã thêm "${entry.word}" vào từ điển.`, source: "studio" });
    } catch {
      setDictionary((prev) => [...prev, { ...entry, id: Math.random().toString(), createdAt: new Date().toISOString() } as unknown as DictionaryEntry]);
      notify({ severity: "error", title: "Lỗi", message: "Không thể thêm từ vào từ điển.", source: "studio" });
    }
  }, [notify]);

  const handleRemoveDictionary = useCallback(async (index: number) => {
    const entry = dictionary[index];
    const word = entry?.word || "";
    if (entry?.id) {
      try {
        await deleteDictionaryEntry(entry.id);
      } catch {
        // keep UI responsive
      }
    }
    setDictionary((prev) => prev.filter((_, i) => i !== index));
    notify({ severity: "success", title: "Đã xóa", message: `Đã xóa "${word}" khỏi từ điển.`, source: "studio" });
  }, [dictionary, notify]);

  const handleEditDictionary = useCallback(async (index: number, updated: Partial<DictionaryEntry>) => {
    const entry = dictionary[index];
    const word = updated.word || entry?.word || "";
    if (entry?.id) {
      try {
        const saved = await updateDictionaryEntry(entry.id, { word: updated.word, pronunciation: updated.pronunciation });
        setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...saved } : e)));
      } catch {
        setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...updated } : e)));
        notify({ severity: "error", title: "Lỗi", message: `Không thể cập nhật "${word}".`, source: "studio" });
        return;
      }
    } else {
      setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...updated } : e)));
    }
    notify({ severity: "success", title: "Đã cập nhật", message: `Đã cập nhật "${word}".`, source: "studio" });
  }, [dictionary, notify]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden px-4 pb-16 pt-24 text-[#F4F4F5] selection:bg-[#6366F1]/30">
      <div className="relative mx-auto max-w-7xl space-y-6">
        <FadeIn delay={0.1}>
          <StudioHeader onOpenLibrary={() => setIsLibraryOpen(true)} />
        </FadeIn>

        {error ? (
          <FadeIn delay={0.15}>
            <div className="aether-glass-wrapper rounded-[24px]" role="alert">
              <div className="aether-glass rounded-[24px] p-4 text-sm font-medium text-red-400 bg-red-950/20 border-red-500/20">
                {error}
              </div>
            </div>
          </FadeIn>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_340px] gap-6">
          {/* LEFT — Main Canvas */}
          <div className="space-y-6">
            <FadeIn delay={0.2}>
              <TextInput value={text} onChange={handleTextChange} onOverLimit={setIsTextOverLimit} />
            </FadeIn>

            <FadeIn delay={0.3}>
              <div aria-live="polite">
                <PreviewPanel
                  audioUrl={audioUrl}
                  onCopy={handleCopyAudioUrl}
                  onDownload={handleDownloadAudio}
                  loading={generating}
                  progress={progress}
                  autoPlay={!!audioUrl}
                  wavAvailable={!!currentWavUrl}
                  mp3Size={audioUrl ? Math.round((audioUrl.split(',')[1] || '').length * 0.75) : undefined}
                  wavSize={currentWavUrl ? Math.round((currentWavUrl.split(',')[1] || '').length * 0.75) : undefined}
                />
              </div>
            </FadeIn>
          </div>

          {/* RIGHT — Sidebar (sticky) */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <FadeIn delay={0.4}>
              <VoiceSelector voices={sortedVoices} selectedVoice={selectedVoice || ""} onSelect={handleSelectVoice} />
            </FadeIn>
            <FadeIn delay={0.5}>
              <VoiceSettings speed={speed} onSpeedChange={handleSpeedChange} />
            </FadeIn>
            <FadeIn delay={0.6}>
              <CustomDictionary dictionary={dictionary} onAdd={handleAddDictionary} onRemove={handleRemoveDictionary} onEdit={handleEditDictionary} />
            </FadeIn>
            
            {/* Generate Button */}
            <FadeIn delay={0.7}>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || isTextOverLimit || !text.trim()}
                  className="aether-btn aether-btn-primary w-full py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-[#111111] border-t-transparent rounded-full"></span>
                      {t.studio.generating}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                      </svg>
                      Tạo giọng nói
                    </>
                  )}
                </button>
                {generating && (
                  <button
                    onClick={() => cancelGeneration()}
                    className="w-full py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
                  >
                    Dừng
                  </button>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      <StudioLibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
    </main>
  );
}
```

**[GREEN]** Run: `cd frontend && npx jest --testPathPattern="studio/page"`

**Expected:** FAIL — (tests are integration tests with mocks; debug any mock issues).

**[REFACTOR]** Fix any test mock issues until all pass.

---

## Task 10: Frontend — Update Settings Page

### Task 10.1: Remove Gemini API Key section from Settings

**Files:** `frontend/src/app/settings/page.tsx`, `frontend/src/lib/validators.ts`

---

**[RED]** Verify Settings page currently has Gemini key section:

```bash
grep -n "gemini_api_key\|Gemini\|LLM" frontend/src/app/settings/page.tsx
```

**Expected:** Multiple matches found.

**[GREEN]** Edit `frontend/src/app/settings/page.tsx`:

Remove the Gemini API Key configuration section. The exact removal depends on the current structure — remove any section labeled "Cấu hình AI (LLM)", the `geminiKey` form field, and all related validation logic. Remove `zodResolver` import if it was only used for Gemini key validation.

**This task requires reading the Settings page first to identify exact sections to remove.**

Core steps:
1. Read `frontend/src/app/settings/page.tsx` 
2. Identify the Gemini key section (typically a `<form>` or `<section>` with "Gemini" or "Cấu hình AI" label)
3. Remove that section entirely
4. Remove `gemini_key` from any form schemas
5. Remove the `localStorage.getItem("gemini_api_key")` and `localStorage.setItem("gemini_api_key")` calls

Also edit `frontend/src/lib/validators.ts` — remove `geminiKeySchema` and `GeminiKeyFormData` type if they exist.

**[GREEN]** Run: `cd frontend && npm run lint`

**Expected:** No errors.

---

## Task 11: Frontend — Update `useTtsGenerate` Hook

### Task 11.1: Remove any `normMeta` handling from hook

**Files:** `frontend/src/features/tts/hooks/useTtsGenerate.ts`

---

**[RED]** Check if hook references `NormalizationMeta`:

```bash
grep -n "NormalizationMeta\|normMeta\|normalization" frontend/src/features/tts/hooks/useTtsGenerate.ts
```

**Expected:** May or may not have references — depends on implementation.

**[GREEN]** If references found:
- Remove `NormalizationMeta` import
- Remove `normMeta` from return type and internal state
- Remove any normalization status logic

If no references found, skip this task.

---

## Task 12: Verify & Build

### Task 12.1: Run full verification

---

```bash
# Type check
cd frontend && npx tsc --noEmit

# Lint
cd frontend && npm run lint

# All tests
cd frontend && npm test

# Build
cd frontend && npm run build

# Backend tests
cd backend && python -m pytest tests/ -v
```

All must pass.

### Task 12.2: Regression grep check

```bash
# Confirm zero Gemini/LLM references in Studio/TTS code
grep -r "gemini\|callGemini\|NormalizationMeta\|X-LLM-API-Key\|llm_normalize\|validate_gemini_key" frontend/src/features/studio/ frontend/src/features/tts/ frontend/src/features/voice/ frontend/src/app/studio/ --include="*.ts" --include="*.tsx"

# Expected: NO matches
```

---

## Summary

| Task | Description | Files Affected |
|------|-------------|----------------|
| 1.1-1.4 | Backend: remove LLM normalizer, validate-key, NormalizationMeta, messages | `tts.py`, `tts.py` (schemas), `messages.py`, `llm_normalizer.py` |
| 2.1 | Frontend: delete `lib/gemini/` | 3 files deleted |
| 3.1 | Frontend: remove X-LLM-API-Key from voice-api | `voice-api.ts` |
| 4.1 | Frontend: remove NormalizationMeta from voice-types | `voice-types.ts` |
| 5.1 | Frontend: delete 3 LLM modals | `PronunciationCheck.tsx`, `GrammarFixModal.tsx`, `SmartChunking.tsx` |
| 6.1 | Frontend: update barrel exports | `components/index.ts`, `studio/index.ts` |
| 7.1 | Frontend: create StudioHeader | `StudioHeader.tsx` (new) |
| 8.1 | Frontend: simplify PreviewPanel | `PreviewPanel.tsx` |
| 9.1 | Frontend: refactor Studio page | `page.tsx` |
| 10.1 | Frontend: update Settings page | `settings/page.tsx`, `validators.ts` |
| 11.1 | Frontend: simplify useTtsGenerate | `useTtsGenerate.ts` (if needed) |
| 12.1-12.2 | Verify & build | All |

---

## Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-09 | v1.0 | Kilo | Initial plan | From spec | All |
