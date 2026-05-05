# FFmpeg.wasm MP3 Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Convert TTS audio from WAV to MP3 using FFmpeg.wasm on the frontend, reducing storage by ~88%.

**Architecture:** After TTS generation (worker or server), `convertWavToMp3()` transcodes the WAV buffer to MP3 at 128kbps CBR via FFmpeg.wasm. The MP3 data URL is stored in IndexedDB as `audio_mp3`; the WAV is kept in memory only for current-session download. Backend sync endpoints accept the new `audio_mp3` field and upload to R2 with `audio/mpeg` content type.

**Tech Stack:** `@ffmpeg/ffmpeg@^0.12`, `@ffmpeg/util@^0.12`, vitest, pytest, COOP/COEP cross-origin isolation headers

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-05

---

## 1. Architecture Overview

### 1.1 System Context

FFmpeg.wasm runs entirely in the browser (WASM sandbox). No audio leaves the client during conversion. The feature adds a single new utility module (`mp3.ts`) and modifies the existing TTS generation / storage / sync pipeline to call it.

### 1.2 Component Interaction

```
Worker/Server → WAV ArrayBuffer/DataURL
                   │
                   ▼
         convertWavToMp3(buffer, sampleRate)   ← NEW (mp3.ts)
                   │
          ┌────────┴────────┐
          ▼                 ▼
    MP3 data URL      WAV data URL (memory only)
          │                 │
          ▼                 ▼
    IndexedDB            Download dropdown
    (audio_mp3)          ├─ MP3 (~300KB) from DB
    (audio_url ← MP3)    └─ WAV (~2.5MB) from memory
          │
          ▼
    Cloud Sync → backend receives audio_mp3 → R2 (audio/mpeg, .mp3)
```

---

## 2. Tech Stack & Dependencies

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Library | `@ffmpeg/ffmpeg` | ^0.12 | Browser WASM FFmpeg, single-core variant |
| Library | `@ffmpeg/util` | ^0.12 | Helper to fetch and convert Blob <-> Uint8Array |
| Frontend test | vitest | existing | Unit tests for mp3 conversion |
| Backend test | pytest | existing | Integration tests for library sync |
| Config | COOP/COEP headers | — | Required for SharedArrayBuffer |

### 2.1 New Dependencies

- `@ffmpeg/ffmpeg@^0.12`: Core WASM FFmpeg runtime (single-core, ~8MB WASM gzipped ~2.5MB)
- `@ffmpeg/util@^0.12`: Blob/Uint8Array conversion utilities for FFmpeg.wasm

### 2.2 Existing Modules Used (read-only)

- `frontend/src/lib/audio/wav.ts`: `encodeWav()`, `decodeWav()` — used to convert between Float32/ArrayBuffer before feeding to FFmpeg
- `frontend/src/features/voice/types/voice-types.ts`: `TTSGenerateResponse` — extended with optional `audio_mp3`, `audio_wav`
- `frontend/src/workers/tts-worker.ts`: Worker returns `ArrayBuffer` (unchanged)
- `backend/app/services/r2_service.py`: `r2_library_service.upload_file()` — receives `content_type` param

---

## 3. Data Model

### 3.1 Schema Design

**frontend `LibraryRecord` (IndexedDB)**

| Field | Type | Notes |
|-------|------|-------|
| `audio_mp3?` | `string` | MP3 base64 data URL — primary for new records. Absent in old records. |
| `audio_url` | `string` | For new records: also set to MP3 data URL (backward compat). For old records: WAV data URL. |
| `audio_wav?` | `string` | WAV base64 data URL — ONLY in memory, NEVER persisted to IndexedDB. Used for session WAV download. |

**backend `SyncRecordItem` (Pydantic)**

| Field | Type | Notes |
|-------|------|-------|
| `audio_mp3?` | `str | None = None` | NEW optional field. MP3 base64 data URL. |
| `audio_data` | `str` | UNCHANGED. Existing WAV field, kept for backward compat. |

**backend `AudioRecord` (SQLAlchemy — unchanged)**

No schema change. `file_url` now points to `.mp3` file instead of `.wav` when `audio_mp3` is used.

### 3.2 Migration Strategy

- IndexedDB: No version bump needed. New records include `audio_mp3` field; old records without it are handled by `audio_mp3 ?? audio_url` fallback.
- PostgreSQL/R2: No migration needed. Backend detects `audio_mp3` vs `audio_data` at runtime.
- R2 delete: When deleting old `.wav` records, `r2_key` pattern changes from `.wav` to `.mp3` for new records. The delete endpoint uses `record.file_url` to derive the key backwards — no schema change needed (key is derived from `file_url`).

---

## 4. API Contracts

### 4.1 Endpoints

**`POST /library/sync` — request body (updated)**

| Aspect | Detail |
|--------|--------|
| Auth | Required (JWT cookie) |
| Request Body | `{ "records": [{ "id": "uuid", "text_content": "hello", "voice_id": "v1", "audio_data": "...", "audio_mp3": "...", "file_size_bytes": 2500, "duration": 1.5 }] }` |
| Response 200 | `{ "synced": [{ "id": "uuid", "file_url": "https://r2.../audio/user1/uuid.mp3", "synced_at": "2024-..." }], "failed": [] }` |
| Notes | `audio_mp3` is optional. If present AND decodable, it takes priority over `audio_data`. |

---

## 5. Internal Service Design

### 5.1 Service Interfaces

```typescript
// frontend/src/lib/audio/mp3.ts

export interface Mp3ConversionResult {
  mp3Blob: Blob;
  mp3DataUrl: string;
  sampleRate: number;
  originalWavBuffer: ArrayBuffer;  // kept for in-memory WAV download
  wavDataUrl: string;              // kept for in-memory WAV download
}

/**
 * Convert a WAV ArrayBuffer to MP3 at 128kbps CBR using FFmpeg.wasm.
 *
 * @param wavBuffer  - Raw WAV file as ArrayBuffer (PCM 16-bit, mono)
 * @param sampleRate - Audio sample rate (e.g. 22050)
 * @returns ConversionResult with both MP3 and WAV data URLs
 * @throws Error on empty input or conversion failure
 */
export async function convertWavToMp3(
  wavBuffer: ArrayBuffer,
  sampleRate: number,
): Promise<Mp3ConversionResult>;
```

### 5.2 Service Composition

```
useTtsGenerate              mp3.ts                    FFmpegWASM
     │                         │                          │
     ├─ worker path:          │                          │
     │  ArrayBuffer ─────────►│                          │
     │                         ├── FFmpeg.load() ────────►│
     │                         ├── writeFile('input.wav')─►│
     │                         ├── exec(['-i','input.wav',│
     │                         │     '-b:a','128k',      │
     │                         │     '-ac','1',          │
     │                         │     'output.mp3']) ─────►│
     │                         ├── readFile('output.mp3')◄│
     │                         │                          │
     │  Mp3ConversionResult ◄──┤                          │
     │                         │                          │
     ├─ server path:          │                          │
     │  data URL ──► fetch to │                          │
     │  ArrayBuffer ─────────►│  (same as above)         │
```

---

## 6. Error Handling

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| — | — | FFmpeg.wasm core load fails (network timeout) | Fallback WAV, toast "Không tải được MP3 converter" |
| — | — | Conversion crash (OOM) | Fallback WAV, toast "File quá dài, đã lưu bản WAV" |
| — | — | No SharedArrayBuffer (no COOP/COEP) | Fallback WAV, toast "Trình duyệt không hỗ trợ nén MP3" |
| — | 400 | Backend receives empty `audio_mp3` | Skip MP3, use `audio_data` |
| — | 500 | Backend fails base64 decode on `audio_mp3` | Log warning, fallback to `audio_data` |

---

## 7. Test Strategy

> **TDD Required:** Every task step must follow RED-GREEN-REFACTOR cycle.

### 7.1 Coverage Target

| Layer | What to Test | Target |
|-------|-------------|--------|
| `mp3.ts` | Conversion produces valid MP3 Blob, handles errors | 90% |
| `library_service.py` | `batch_sync` routes MP3 vs WAV correctly | 80% |

---

## 8. Constraints & Trade-offs

### 8.1 Constraints

- Must follow AGENTS.md conventions (TDD, SPEC naming)
- COOP/COEP headers must not break Google OAuth popup
- Backward compatible: old IndexedDB records (WAV-only) must still play
- Bundle size: FFmpeg.wasm single-core MUST be lazy loaded

### 8.2 Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|-----------------|
| MP3 128kbps CBR | VBR / higher bitrate | Predictable file size, good quality/size balance for voice |
| Frontend-only conversion | Backend FFmpeg | No server CPU cost, no audio leaves browser, simpler |
| WAV memory-only, not persisted | Store both in IndexedDB | Saves ~10x storage per record |
| COOP `same-origin-allow-popups` | `same-origin` strict | Required for Google OAuth popup to still work |
| COEP `credentialless` | `require-corp` | Avoids breaking R2 CDN cross-origin resources that don't send CORP headers |

### 8.3 Out of Scope (Technical)

- Backend FFmpeg conversion
- Other audio formats (OGG, FLAC, AAC)
- Configurable bitrate UI
- Batch conversion of existing library records
- Audio editing/trimming

---

## 9. Implementation Tasks

### Task 1: Install FFmpeg.wasm dependencies

**Description:** Add `@ffmpeg/ffmpeg@^0.12` and `@ffmpeg/util@^0.12` to frontend package.json.

**Files:** `frontend/package.json`

---

```bash
# Run: install dependencies
npm install @ffmpeg/ffmpeg@^0.12 @ffmpeg/util@^0.12
```

**Expected:** Dependencies added to `package.json` and `node_modules`.

---

### Task 2: Backend — Add `audio_mp3` field to sync schema and service

**Description:** Update `SyncRecordItem` to accept optional `audio_mp3`, and update `batch_sync` to prefer MP3 over WAV.

**Files:** `backend/app/schemas/library_sync.py`, `backend/app/services/library_service.py`, `backend/tests/services/test_library_sync.py`

---

**[RED]** Write failing test:

```python
# backend/tests/services/test_library_sync.py
import base64
import pytest
from unittest.mock import patch, MagicMock

def test_batch_sync_uses_audio_mp3_when_available():
    """batch_sync should upload with audio/mpeg when audio_mp3 field is present."""
    from app.services.library_service import LibraryService

    mock_db = MagicMock()
    service = LibraryService(mock_db)

    mp3_bytes = b'\xff\xfb\x90\x00' + b'\x00' * 100  # valid MP3 frame header
    records = [
        {
            "id": "rec1",
            "text_content": "hello",
            "voice_id": "v1",
            "audio_data": "AAAA",  # WAV (ignored when audio_mp3 present)
            "audio_mp3": base64.b64encode(mp3_bytes).decode(),
            "file_size_bytes": len(mp3_bytes),
            "duration": 1.5,
        },
    ]

    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.r2_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"

                result = service.batch_sync("user1", records)

    assert len(result["synced"]) == 1
    # Verify upload was called with audio/mpeg and .mp3 key
    upload_call = mock_r2.upload_file.call_args
    assert upload_call.kwargs["content_type"] == "audio/mpeg"
    assert ".mp3" in upload_call.kwargs["object_name"]


def test_batch_sync_falls_back_to_audio_data():
    """batch_sync should use audio_data (WAV) when audio_mp3 is not present."""
    from app.services.library_service import LibraryService

    mock_db = MagicMock()
    service = LibraryService(mock_db)

    records = [
        {"id": "rec1", "text_content": "hello", "voice_id": "v1",
         "audio_data": "AAAA", "file_size_bytes": 100, "duration": 1.5},
    ]

    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.r2_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"

                result = service.batch_sync("user1", records)

    assert len(result["synced"]) == 1
    upload_call = mock_r2.upload_file.call_args
    assert upload_call.kwargs["content_type"] == "audio/wav"
    assert ".wav" in upload_call.kwargs["object_name"]


def test_batch_sync_handles_invalid_audio_mp3():
    """batch_sync should fall back to audio_data when audio_mp3 is invalid base64."""
    from app.services.library_service import LibraryService

    mock_db = MagicMock()
    service = LibraryService(mock_db)

    records = [
        {
            "id": "rec1",
            "text_content": "hello",
            "voice_id": "v1",
            "audio_data": "AAAA",
            "audio_mp3": "!!!not-valid-base64!!!",
            "file_size_bytes": 100,
            "duration": 1.5,
        },
    ]

    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.r2_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"

                result = service.batch_sync("user1", records)

    # Should fall back to WAV (audio_data) without crashing
    assert len(result["synced"]) == 1
    upload_call = mock_r2.upload_file.call_args
    assert upload_call.kwargs["content_type"] == "audio/wav"
```

**[RED]** Run: `cd backend && python -m pytest tests/services/test_library_sync.py -v`
**Expected:** FAIL — tests fail because `audio_mp3` field is not handled.

**[GREEN]** Write minimal implementation:

`backend/app/schemas/library_sync.py`:

```python
from datetime import datetime
from pydantic import BaseModel


class SyncRecordItem(BaseModel):
    id: str
    text_content: str
    voice_id: str
    audio_data: str
    audio_mp3: str | None = None
    file_size_bytes: int
    duration: float | None = None
```

`backend/app/services/library_service.py` — update `batch_sync` method (replace the for-loop body):

```python
def batch_sync(self, user_id: str, records: list[dict[str, Any]]) -> dict[str, list]:
    from datetime import datetime

    synced = []
    failed = []

    for rec in records:
        try:
            # Determine source: prefer audio_mp3 over audio_data
            use_mp3 = False
            raw = rec.get("audio_mp3")
            if raw and raw.strip():
                use_mp3 = True
            else:
                raw = rec.get("audio_data", "")

            if raw.startswith("data:"):
                raw = raw.split(",", 1)[1]

            try:
                file_bytes = base64.b64decode(raw)
            except Exception:
                if use_mp3:
                    # audio_mp3 failed — fall back to audio_data
                    raw = rec.get("audio_data", "")
                    if raw.startswith("data:"):
                        raw = raw.split(",", 1)[1]
                    file_bytes = base64.b64decode(raw)
                    use_mp3 = False
                else:
                    raise

            file_size_mb = max(1, len(file_bytes) // (1024 * 1024))

            if not self.quota_service.check_quota(user_id, "storage", file_size_mb):
                failed.append({"id": rec["id"], "error": "Storage quota exceeded"})
                continue

            record_id = rec["id"]
            ext = "mp3" if use_mp3 else "wav"
            content_type = "audio/mpeg" if use_mp3 else "audio/wav"
            r2_key = f"audio/{user_id}/{record_id}.{ext}"

            r2_library_service.upload_file(
                file_bytes=file_bytes,
                object_name=r2_key,
                content_type=content_type,
            )

            public_url = r2_library_service.get_public_url(r2_key)

            record = AudioRecord(
                id=record_id,
                user_id=user_id,
                voice_id=rec["voice_id"],
                text_content=rec["text_content"],
                file_url=public_url,
                file_size_bytes=rec.get("file_size_bytes", len(file_bytes)),
                duration=rec.get("duration"),
            )
            self.uow.session.merge(record)
            self.quota_service.consume_quota(user_id, "storage", file_size_mb)
            self.uow.flush()

            synced.append({"id": record_id, "file_url": public_url, "synced_at": datetime.utcnow()})

        except Exception as e:
            logger.error(f"Sync failed for {rec.get('id')}: {e}")
            self.uow.rollback()
            failed.append({"id": rec.get("id", "unknown"), "error": str(e)})

    try:
        self.uow.commit()
    except Exception:
        self.uow.rollback()
    return {"synced": synced, "failed": failed}
```

**[GREEN]** Run: `cd backend && python -m pytest tests/services/test_library_sync.py -v`
**Expected:** 3 PASS

**[REFACTOR]** None needed.

---

### Task 3: Frontend — Create `mp3.ts` conversion utility

**Description:** Create `convertWavToMp3()` using FFmpeg.wasm with lazy loading and timeout.

**Files:** `frontend/src/lib/audio/mp3.ts`, `frontend/src/lib/audio/mp3.test.ts`

---

**[RED]** Write failing tests:

```typescript
// frontend/src/lib/audio/mp3.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock FFmpeg.wasm BEFORE importing the module under test
const mockExec = vi.fn();
const mockWriteFile = vi.fn();
const mockReadFile = vi.fn();
const mockLoad = vi.fn();

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => ({
    load: mockLoad,
    writeFile: mockWriteFile,
    exec: mockExec,
    readFile: mockReadFile,
  })),
}));

import { convertWavToMp3 } from './mp3';

function createValidWavBuffer(durationSec: number, sampleRate = 22050): ArrayBuffer {
  const numSamples = durationSec * sampleRate;
  const dataSize = numSamples * 2; // 16-bit mono
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46); // "RIFF"
  view.setUint32(4, bufferSize - 8, true);
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45); // "WAVE"
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20); // "fmt "
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61); // "data"
  view.setUint32(40, dataSize, true);

  // Fill with low-level sine wave
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.round(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16000);
    view.setInt16(44 + i * 2, sample, true);
  }
  return buffer;
}

describe('convertWavToMp3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-04: converts valid WAV to MP3 Blob', async () => {
    const mp3Bytes = new Uint8Array([0xFF, 0xFB, 0x90, 0x00, 0x01, 0x02, 0x03]);
    mockLoad.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockExec.mockResolvedValue(0);
    mockReadFile.mockResolvedValue(mp3Bytes);

    const wavBuffer = createValidWavBuffer(0.1, 22050);

    const result = await convertWavToMp3(wavBuffer, 22050);

    expect(result.mp3Blob.type).toBe('audio/mpeg');
    expect(result.mp3Blob.size).toBeLessThan(wavBuffer.byteLength * 0.15);
    expect(result.mp3DataUrl).toMatch(/^data:audio\/mpeg;base64,/);
    expect(result.sampleRate).toBe(22050);
    expect(result.originalWavBuffer).toBe(wavBuffer);
    expect(result.wavDataUrl).toMatch(/^data:audio\/wav;base64,/);
  });

  it('TC-05: rejects on empty buffer', async () => {
    const emptyBuffer = new ArrayBuffer(0);
    await expect(convertWavToMp3(emptyBuffer, 22050)).rejects.toThrow('empty');
  });
});
```

**[RED]** Run: `npx vitest run src/lib/audio/mp3.test.ts`
**Expected:** FAIL — Cannot find module './mp3'.

**[GREEN]** Write minimal implementation:

```typescript
// frontend/src/lib/audio/mp3.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm';
const CONVERSION_TIMEOUT_MS = 30_000;
const CORE_LOAD_TIMEOUT_MS = 15_000;

export interface Mp3ConversionResult {
  mp3Blob: Blob;
  mp3DataUrl: string;
  sampleRate: number;
  originalWavBuffer: ArrayBuffer;
  wavDataUrl: string;
}

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  if (loadPromise) return loadPromise.then(() => ffmpeg!);

  ffmpeg = new FFmpeg();
  loadPromise = (async () => {
    const coreResponse = await fetch(
      toBlobURL(FFMPEG_CORE_URL, 'application/javascript'),
    );
    const wasmResponse = await fetch(
      toBlobURL(FFMPEG_WASM_URL, 'application/wasm'),
    );

    const loadWithTimeout = Promise.race([
      ffmpeg!.load({ coreURL: coreResponse, wasmURL: wasmResponse }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg core load timeout')), CORE_LOAD_TIMEOUT_MS),
      ),
    ]);
    await loadWithTimeout;
  })();

  return loadPromise.then(() => ffmpeg!);
}

export async function convertWavToMp3(
  wavBuffer: ArrayBuffer,
  sampleRate: number,
): Promise<Mp3ConversionResult> {
  if (wavBuffer.byteLength === 0) {
    throw new Error('Input WAV buffer is empty');
  }

  const ff = await getFFmpeg();

  await ff.writeFile('input.wav', await fetchFile(new Blob([wavBuffer])));

  const execPromise = ff.exec([
    '-i', 'input.wav',
    '-b:a', '128k',
    '-ac', '1',
    '-ar', String(sampleRate),
    'output.mp3',
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('MP3 conversion timeout')), CONVERSION_TIMEOUT_MS),
  );

  await Promise.race([execPromise, timeoutPromise]);

  const mp3Data = await ff.readFile('output.mp3');
  const mp3Blob = new Blob([mp3Data], { type: 'audio/mpeg' });

  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

  const mp3DataUrl = await blobToDataUrl(mp3Blob);
  const wavDataUrl = await blobToDataUrl(wavBlob);

  return {
    mp3Blob,
    mp3DataUrl,
    sampleRate,
    originalWavBuffer: wavBuffer,
    wavDataUrl,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

**[GREEN]** Run: `npx vitest run src/lib/audio/mp3.test.ts`
**Expected:** 2 PASS

**[REFACTOR]** None needed.

---

### Task 4: Frontend — Update `TTSGenerateResponse` and `LibraryRecord` types

**Description:** Add optional `audio_mp3` and `audio_wav` fields to TTS response type, and `audio_mp3`, `audio_wav` to LibraryRecord.

**Files:** `frontend/src/features/voice/types/voice-types.ts`, `frontend/src/features/library/types.ts`

---

```typescript
// frontend/src/features/voice/types/voice-types.ts — update schema
export const ttsGenerateResponseSchema = z.object({
  audio_url: z.string(),
  duration: z.number(),
  voice_id: z.string(),
  normalization: normalizationMetaSchema.optional(),
  audio_mp3: z.string().optional(),
  audio_wav: z.string().optional(),
});
```

```typescript
// frontend/src/features/library/types.ts — update interface
export interface LibraryRecord {
  id: string;
  text_content: string;
  voice_id: string;
  audio_url: string;
  audio_mp3?: string;
  audio_wav?: string;
  file_size_bytes: number;
  duration: number | null;
  created_at: string;
  sync_status: SyncStatus;
  user_id?: string;
}
```

No TDD needed — these are type-level changes verified by TypeScript build.

---

### Task 5: Frontend — Update `useTtsGenerate` to call MP3 conversion

**Description:** After TTS generation (both worker and server paths), call `convertWavToMp3()`, include the result in the resolved response.

**Files:** `frontend/src/features/tts/hooks/useTtsGenerate.ts`

---

```typescript
// frontend/src/features/tts/hooks/useTtsGenerate.ts
// ADD import at top:
import { convertWavToMp3 } from '@/lib/audio/mp3';

// REPLACE the worker 'audio' handler (lines 63-102) with:
} else if (type === 'audio') {
  const rawBuffer = event.data.buffer as ArrayBuffer;
  const dataView = new DataView(rawBuffer);
  const sampleRate = dataView.getUint32(24, true);
  const channels = dataView.getUint16(22, true);
  const bitsPerSample = dataView.getUint16(34, true);
  let wavDuration = 0;
  if (sampleRate && channels && bitsPerSample) {
    let offset = 12;
    while (offset + 8 <= rawBuffer.byteLength) {
      const chunkId = String.fromCharCode(
        dataView.getUint8(offset), dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2), dataView.getUint8(offset + 3)
      );
      const chunkSize = dataView.getUint32(offset + 4, true);
      if (chunkId === 'data') {
        wavDuration = Math.round((chunkSize / (sampleRate * channels * (bitsPerSample / 8))) * 10) / 10;
        break;
      }
      offset += 8 + chunkSize;
    }
  }

  convertWavToMp3(rawBuffer, sampleRate || 22050)
    .then((mp3Result) => {
      resolve({
        audio_url: mp3Result.mp3DataUrl,
        duration: wavDuration,
        voice_id: request.voice_id,
        audio_mp3: mp3Result.mp3DataUrl,
        audio_wav: mp3Result.wavDataUrl,
      });
    })
    .catch((err) => {
      console.warn('[TTS] MP3 conversion failed, using WAV:', err);
      // Fallback: use WAV as-is
      const blob = new Blob([rawBuffer], { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onload = () => {
        const wavUrl = reader.result as string;
        resolve({
          audio_url: wavUrl,
          duration: wavDuration,
          voice_id: request.voice_id,
          audio_mp3: wavUrl,
          audio_wav: wavUrl,
        });
      };
      reader.readAsDataURL(blob);
    });

  apiRequest('/quota/record', {
    method: 'POST',
    body: JSON.stringify({ characters: request.text.length, api_calls: 1 }),
    allowEmpty: true,
  }).catch(() => {});
}
```

Also update the server fallback paths (both `worker.onmessage` error handler and setTimeout timeout handler — currently both call `generateTts(request).then(resolve).catch(reject)`):

Replace both `generateTts(request).then(resolve).catch(reject)` with:

```typescript
generateTts(request).then(async (serverResponse) => {
  try {
    // Server returns WAV data URL — convert to MP3
    const resp = await fetch(serverResponse.audio_url);
    const wavBuffer = await resp.arrayBuffer();
    const sampleRate = 22050;
    const mp3Result = await convertWavToMp3(wavBuffer, sampleRate);
    serverResponse.audio_mp3 = mp3Result.mp3DataUrl;
    serverResponse.audio_wav = serverResponse.audio_url;
    serverResponse.audio_url = mp3Result.mp3DataUrl;
    resolve(serverResponse);
  } catch {
    // Fallback: keep server WAV as-is
    resolve(serverResponse);
  }
}).catch(reject);
```

---

### Task 6: Frontend — Update Studio page download and save logic

**Description:** Update `handleDownloadAudio` to accept a format parameter, and `handleGenerationSuccess` to pass MP3/WAV data URLs.

**Files:** `frontend/src/app/studio/page.tsx`, `frontend/src/features/studio/components/AudioPreview.tsx`

---

`frontend/src/app/studio/page.tsx`:

Replace `handleDownloadAudio` (lines 126-132):

```typescript
const handleDownloadAudio = useCallback((format: 'mp3' | 'wav' = 'mp3') => {
  const url = format === 'wav' ? currentWavUrl : audioUrl;
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = `genvoice-audio.${format}`;
  a.click();
}, [audioUrl, currentWavUrl]);
```

Add state for current WAV URL (near other states):

```typescript
const [currentWavUrl, setCurrentWavUrl] = useState<string | null>(null);
```

Update `handleGenerationSuccess` (replace lines 134-153):

```typescript
const handleGenerationSuccess = useCallback((nextAudioUrl: string, duration: number, normalization?: NormalizationMeta | null, mp3Url?: string, wavUrl?: string) => {
  setAudioUrl(mp3Url || nextAudioUrl);
  if (wavUrl) setCurrentWavUrl(wavUrl);
  setShowSuccessCard(true);
  setTimeout(() => {
    const audioEl = document.querySelector('audio') as HTMLAudioElement | null;
    audioEl?.play().catch(() => {});
  }, 100);
  if (normalization) setNormMeta(normalization);
  notify({ severity: "success", title: t.studio.successTitle, message: t.studio.successMessage, source: "studio", actionLabel: t.studio.audioDownload, actionHref: mp3Url || nextAudioUrl });
  const mp3DataUrl = mp3Url || nextAudioUrl;
  const base64Data = mp3DataUrl.split(',')[1] || '';
  const fileSizeBytes = Math.round(base64Data.length * 0.75);
  saveLocalRecord({ 
    id: crypto.randomUUID(), 
    audio_url: mp3DataUrl,
    audio_mp3: mp3DataUrl,
    text_content: text, 
    voice_id: voiceId,
    duration,
    file_size_bytes: fileSizeBytes,
    created_at: new Date().toISOString() 
  });
}, [saveLocalRecord, text, voiceId]);
```

Update `handleGenerate` (line 180) to pass new fields:

```typescript
handleGenerationSuccess(
  response.audio_url,
  response.duration,
  response.normalization,
  response.audio_mp3,
  response.audio_wav,
);
```

Update `AudioPreview` prop types and component:

```typescript
// frontend/src/features/studio/components/AudioPreview.tsx

// UPDATE the interface props:
interface AudioPreviewProps {
  audioUrl: string | null;
  loading: boolean;
  onDownload: (format: 'mp3' | 'wav') => void;
  onCopy: () => void;
  wavAvailable: boolean;
  mp3Size?: number;
  wavSize?: number;
  error?: string | null;
  progress: number;
  autoPlay?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}
```

Replace the download button (lines 70-77) with a dropdown:

```tsx
<div className="relative group/download inline-flex">
  <button
    type="button"
    onClick={() => onDownload('mp3')}
    className="flex items-center gap-2 px-4 py-2 border border-[var(--color-meridian-primary)]/30 bg-[var(--color-meridian-primary)]/10 hover:bg-[var(--color-meridian-primary)]/20 rounded-[8px] rounded-r-none font-light uppercase tracking-widest text-[10px] text-[var(--color-meridian-secondary)] transition-all hover:scale-[1.02] active:scale-[0.98]"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
    {mp3Size ? `${t.studio.audioDownload} MP3 (~${Math.round(mp3Size / 1024)}KB)` : t.studio.audioDownload}
  </button>
  {wavAvailable && (
    <>
      <button
        type="button"
        className="flex items-center px-2 py-2 border border-l-0 border-[var(--color-meridian-primary)]/30 bg-[var(--color-meridian-primary)]/10 hover:bg-[var(--color-meridian-primary)]/20 rounded-[8px] rounded-l-none text-[var(--color-meridian-secondary)] transition-all"
        aria-label="Download options"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1A2E] border border-white/10 rounded-[8px] shadow-lg opacity-0 invisible group-hover/download:opacity-100 group-hover/download:visible transition-all z-50">
        <button
          type="button"
          onClick={() => onDownload('wav')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-[8px] font-light"
        >
          <span>WAV (lossless</span>
          <span className="text-[#A1A1AA]">
            {wavSize ? `~${(wavSize / (1024 * 1024)).toFixed(1)}MB)` : ''}
          </span>
        </button>
      </div>
    </>
  )}
</div>
```

Update the parent at `frontend/src/app/studio/page.tsx` (around line 234-250 where `AudioPreview` is rendered):

```tsx
<AudioPreview
  audioUrl={audioUrl}
  loading={generating}
  onDownload={handleDownloadAudio}
  onCopy={handleCopyAudioUrl}
  wavAvailable={!!currentWavUrl}
  mp3Size={audioUrl ? Math.round((audioUrl.split(',')[1] || '').length * 0.75) : undefined}
  wavSize={currentWavUrl ? Math.round((currentWavUrl.split(',')[1] || '').length * 0.75) : undefined}
  error={error}
  progress={progress}
  autoPlay={true}
/>
```

---

### Task 7: Frontend — Update LibraryPage download (MP3 only)

**Description:** Library records no longer have WAV in memory, so download shows only MP3.

**Files:** `frontend/src/features/library/components/LibraryPage.tsx`

---

Find the `handleDownload` function and update it:

```typescript
const handleDownload = useCallback((record: LibraryRecord) => {
  const url = record.audio_mp3 || record.audio_url;
  if (!url) return;
  const isMp3 = !!record.audio_mp3;
  const ext = isMp3 ? 'mp3' : 'wav';
  const a = document.createElement('a');
  a.href = url;
  a.download = `genvoice-${record.id}.${ext}`;
  a.click();
}, []);
```

---

### Task 8: Frontend — Update `useLibrarySync` to send `audio_mp3`

**Description:** When syncing, send `audio_mp3` field alongside existing `audio_data`.

**Files:** `frontend/src/features/library/hooks/useLibrarySync.ts`

---

Replace the `syncItems` mapping (lines 26-37):

```typescript
const syncItems = localOnly.map((rec) => {
  const localRec = localRecords.find((r: LibraryRecord) => r.id === rec.id);
  const hasMp3 = !!localRec?.audio_mp3;
  const primaryAudio = hasMp3 ? (localRec?.audio_mp3 || '') : (localRec?.audio_url || '');
  const base64Data = primaryAudio.split(',')[1] || '';
  return {
    id: rec.id,
    text_content: rec.text_content,
    voice_id: rec.voice_id,
    audio_data: localRec?.audio_url || '',
    audio_mp3: localRec?.audio_mp3 || '',
    file_size_bytes: rec.file_size_bytes || Math.round(base64Data.length * 0.75),
    duration: rec.duration ?? null,
  };
});
```

---

### Task 9: Configure COOP/COEP headers

**Description:** Add cross-origin isolation headers required by FFmpeg.wasm's SharedArrayBuffer.

**Files:** `frontend/next.config.ts`

---

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Verification:**
- Open DevTools Console after deploy → `console.log(crossOriginIsolated)` → `true`
- Google OAuth popup still works
- R2 CDN resources (models, voice samples) still load

---

### Task 10: Frontend — Ensure IndexedDB backward compat for playback and types

**Description:** No IndexedDB version bump needed (DB already stores arbitrary objects via `store.put()`). The types change and `useLocalLibrary` hook must handle old records without `audio_mp3`.

**Files:** `frontend/src/features/library/hooks/useLocalLibrary.ts`

---

Find where `LibraryRecord` is read and ensure playback uses `audio_mp3 ?? audio_url`:

```typescript
// In any component reading LibraryRecord, use:
const playbackUrl = record.audio_mp3 || record.audio_url;
```

The existing `useLocalLibrary.ts` already passes records through — no structural change needed since IndexedDB stores JSON objects (arbitrary fields).

---

## 10. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-05 | v1.0 | Kilo | Initial plan | — | All |

### Follow-ups

| Date | Item | Impact | Status |
|------|------|--------|--------|
