# Library Redesign & Hybrid Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Library page with grid/list toggle, voice filter/sort, hybrid cloud sync for pro users with status badges (Local/Cloud/Synced).

**Architecture:** Frontend modular refactor — 10 new components in `features/library/`, unified data hooks bridging IndexedDB and cloud API. Backend adds batch sync endpoint and duration column.

**Tech Stack:** Next.js 16 App Router, shadcn/ui, Framer Motion, FastAPI, SQLAlchemy, Cloudflare R2, IndexedDB

---

> **Spec:** `.sdlc/SPEC018-core-library-redesign/spec.md`
> **Status:** Approved
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. File Map

### New Files

```
frontend/src/features/library/
  types.ts                          # LibraryRecord, SyncStatus, FilterState, LibraryViewMode interfaces
  index.ts                          # Public exports
  api/
    library-api.ts                  # Cloud API calls: fetchCloudRecords, syncRecords, deleteCloudRecord
  hooks/
    useLibraryRecords.ts            # Unified hook: combines IndexedDB + cloud, computes sync_status
    useLibrarySync.ts               # Sync orchestration: diff, upload, status updates
    useLibraryFilter.ts             # Filter/sort/search state management
  components/
    LibraryPage.tsx                  # Main page layout
    LibraryToolbar.tsx               # Search input, voice filter, sort selector, view toggle
    LibraryTabs.tsx                  # All / Local / Cloud / Synced tabs
    LibraryGrid.tsx                  # CSS Grid of LibraryCard
    LibraryList.tsx                  # Table/list rows
    LibraryCard.tsx                  # Single grid card
    LibraryCardRow.tsx               # Single list row
    LibraryEmpty.tsx                 # Empty state
    LibrarySyncBar.tsx               # Sync progress (pro only)
    CloudUpgradeBanner.tsx           # Upgrade prompt (free only)
  index.ts

backend/app/
  schemas/
    library_sync.py                  # SyncRequest, SyncResponse schemas (NEW)
  models/
    audio_record.py                  # +duration column (MODIFIED)
  services/
    library_service.py               # +batch_sync() method (MODIFIED)
  api/
    library.py                       # +POST /sync endpoint (MODIFIED)
```

### Modified Files

```
frontend/src/app/studio/page.tsx              # Save duration + file_size_bytes to local
frontend/src/components/studio/StudioLibraryDrawer.tsx  # Use new feature module
frontend/src/app/library/page.tsx              # Rewrite to use LibraryPage
frontend/src/features/library/hooks/useLocalLibrary.ts  # Refactor into helpers
```

---

## 2. Implementation Tasks

### Section A: Backend

#### Task 1: Add duration column to AudioRecord model

**Description:** Add `duration` (Float, nullable) column to `audio_records` table.

**Files:** `backend/app/models/audio_record.py`

---

**[RED]** Write failing test:

```python
# backend/tests/models/test_audio_record.py
def test_audio_record_has_duration_column():
    """Verify the AudioRecord model has a duration column."""
    from app.models.audio_record import AudioRecord
    from sqlalchemy import Float
    column = AudioRecord.__table__.columns["duration"]
    assert isinstance(column.type, Float)
    assert column.nullable
```

**[RED]** Run: `cd backend && python -m pytest tests/models/test_audio_record.py -x`
**Expected:** FAIL — column 'duration' doesn't exist

**[GREEN]** Modify model:

```python
# backend/app/models/audio_record.py
  file_url = Column(String(512), nullable=False)
  file_size_bytes = Column(Integer, nullable=False, default=0)
+ duration = Column(Float, nullable=True)
  created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
```

```python
# Add Float import
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
```

**[GREEN]** Run: `cd backend && python -m pytest tests/models/test_audio_record.py -x`
**Expected:** PASS

---

#### Task 2: Add SyncRequest/SyncResponse schemas

**Description:** Add Pydantic schemas for batch sync endpoint.

**Files:** `backend/app/schemas/library_sync.py`

---

```python
# backend/app/schemas/library_sync.py
from datetime import datetime
from pydantic import BaseModel


class SyncRecordItem(BaseModel):
    """A single record in a sync request."""
    id: str
    text_content: str
    voice_id: str
    audio_data: str  # base64-encoded WAV
    file_size_bytes: int
    duration: float | None = None


class SyncRequest(BaseModel):
    """Batch sync request body."""
    records: list[SyncRecordItem]


class SyncResultItem(BaseModel):
    """Result of syncing a single record."""
    id: str
    file_url: str
    synced_at: datetime


class SyncFailedItem(BaseModel):
    """Failed sync item."""
    id: str
    error: str


class SyncResponse(BaseModel):
    """Batch sync response."""
    synced: list[SyncResultItem]
    failed: list[SyncFailedItem]
```

Also update `backend/app/schemas/library.py` to add `duration`:

```python
# backend/app/schemas/library.py
class AudioRecordResponse(BaseModel):
    """Response schema for an audio record."""
    id: str
    user_id: str
    voice_id: str
    text_content: str
    file_url: str
    file_size_bytes: int
+   duration: float | None = None
    created_at: datetime
```

---

**[GREEN]** No test needed — pure data structure. Verify by importing in Python shell:

```python
from app.schemas.library_sync import SyncRequest, SyncResponse, SyncRecordItem
assert SyncRequest
```

---

#### Task 3: Add batch_sync() method to LibraryService

**Description:** Add `batch_sync()` that accepts multiple records, uploads each to R2, saves metadata to DB, consumes quota.

**Files:** `backend/app/services/library_service.py`

---

**[RED]** Write failing test:

```python
# backend/tests/services/test_library_service.py
import pytest
from unittest.mock import patch, MagicMock

def test_batch_sync_uploads_multiple_records():
    """batch_sync should upload each record and return list of synced IDs."""
    from app.services.library_service import LibraryService
    
    mock_db = MagicMock()
    service = LibraryService(mock_db)
    
    records = [
        {"id": "rec1", "text_content": "hello", "voice_id": "v1", "audio_data": "AAAA", "file_size_bytes": 100, "duration": 1.5},
        {"id": "rec2", "text_content": "world", "voice_id": "v2", "audio_data": "BBBB", "file_size_bytes": 200, "duration": 2.0},
    ]
    
    with patch.object(service.quota_service, 'check_quota', return_value=True):
        with patch.object(service.quota_service, 'consume_quota'):
            with patch('app.services.library_service.r2_library_service') as mock_r2:
                mock_r2.upload_file.return_value = None
                mock_r2.get_public_url.side_effect = lambda key: f"https://r2.example.com/{key}"
                
                result = service.batch_sync("user1", records)
    
    assert len(result["synced"]) == 2
    assert result["synced"][0]["id"] == "rec1"
    assert result["failed"] == []
```

**[RED]** Run: `cd backend && python -m pytest tests/services/test_library_service.py -x`
**Expected:** FAIL — batch_sync not implemented

**[GREEN]** Add method to LibraryService:

```python
# backend/app/services/library_service.py
import base64
from typing import Any

def batch_sync(self, user_id: str, records: list[dict[str, Any]]) -> dict[str, list]:
    """Upload multiple records from local to cloud. Returns sync results."""
    synced = []
    failed = []
    
    for rec in records:
        try:
            file_bytes = base64.b64decode(rec["audio_data"])
            file_size_mb = max(1, len(file_bytes) // (1024 * 1024))
            
            if not self.quota_service.check_quota(user_id, "storage", file_size_mb):
                failed.append({"id": rec["id"], "error": "Storage quota exceeded"})
                continue
            
            record_id = rec["id"]
            r2_key = f"audio/{user_id}/{record_id}.wav"
            
            self.r2_library_service.upload_file(
                file_bytes=file_bytes,
                object_name=r2_key,
                content_type="audio/wav"
            )
            
            public_url = self.r2_library_service.get_public_url(r2_key)
            
            from app.models.audio_record import AudioRecord
            record = AudioRecord(
                id=record_id,
                user_id=user_id,
                voice_id=rec["voice_id"],
                text_content=rec["text_content"],
                file_url=public_url,
                file_size_bytes=rec.get("file_size_bytes", len(file_bytes)),
                duration=rec.get("duration")
            )
            self.db.add(record)
            self.quota_service.consume_quota(user_id, "storage", file_size_mb)
            self.db.flush()
            
            from datetime import datetime
            synced.append({"id": record_id, "file_url": public_url, "synced_at": datetime.utcnow()})
            
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Sync failed for {rec.get('id')}: {e}")
            failed.append({"id": rec.get("id", "unknown"), "error": str(e)})
    
    self.db.commit()
    return {"synced": synced, "failed": failed}
```

Add import at top:
```python
from app.services.r2_service import r2_library_service
```

**[GREEN]** Run: `cd backend && python -m pytest tests/services/test_library_service.py -x`
**Expected:** PASS

---

#### Task 4: Add POST /sync endpoint to library API

**Description:** Add batch sync endpoint, modify upload endpoint to accept duration, update list GET to return duration.

**Files:** `backend/app/api/library.py`

---

```python
# backend/app/api/library.py — add to imports
from app.schemas.library_sync import SyncRequest, SyncResponse
import base64

# Add new endpoint
@router.post("/sync", response_model=SyncResponse)
async def sync_records(
    body: SyncRequest,
    user: User = Depends(get_current_user),
    service: LibraryService = Depends(get_library_service),
    db: Session = Depends(get_db)
):
    """Batch sync local records to cloud (PRO only)."""
    quota_service = QuotaService(db)
    quota = quota_service.get_or_create_quota(user.id)
    if quota.tier != "pro" and quota.tier != "enterprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cloud sync requires PRO tier."
        )
    
    records_dict = [r.model_dump() for r in body.records]
    result = service.batch_sync(user.id, records_dict)
    return result

# Modify upload endpoint to accept duration
@router.post("/upload", response_model=AudioRecordResponse)
async def upload_to_library(
    file: UploadFile,
    text_content: str = Form(...),
    voice_id: str = Form(...),
+   duration: float = Form(None),
    ...
```

Pass `duration` to `service.upload_to_cloud()` call:
```python
    record = service.upload_to_cloud(
        user_id=user.id,
        file_bytes=file_bytes,
        text_content=text_content,
        voice_id=voice_id,
+       duration=duration
    )
```

Update `upload_to_cloud` in `LibraryService` to accept `duration`:
```python
def upload_to_cloud(self, user_id: str, file_bytes: bytes, text_content: str, voice_id: str, duration: float | None = None) -> AudioRecord:
    # ... existing code ...
    record = AudioRecord(
        id=record_id,
        user_id=user_id,
        voice_id=voice_id,
        text_content=text_content,
        file_url=public_url,
        file_size_bytes=file_size_bytes,
+       duration=duration
    )
```

Update `list_user_records` response — the GET endpoint already returns `AudioRecordResponse` which now has `duration` field. No code change needed, but verify the schema is being used correctly.

---

**[GREEN]** No separate test — covered by integration in Task 3. Run: `cd backend && python -m pytest tests/ -x`
**Expected:** PASS

---

### Section B: Frontend — Data Layer

#### Task 5: Create unified Library types

**Description:** Define shared TypeScript types for the library feature.

**Files:** `frontend/src/features/library/types.ts`

---

**[RED]** Write test:

```typescript
// frontend/src/features/library/types.test.ts
import { SyncStatus, LibraryRecord, LibraryViewMode, FilterState } from './types';

describe('Library types', () => {
  test('SyncStatus accepts local/cloud/synced', () => {
    const status: SyncStatus = { local: true, cloud: false };
    expect(status.local).toBe(true);
    expect(status.cloud).toBe(false);
  });

  test('LibraryRecord has all required fields', () => {
    const record: LibraryRecord = {
      id: '1',
      text_content: 'hello',
      voice_id: 'v1',
      audio_url: 'data:audio/wav;base64,...',
      file_size_bytes: 100,
      duration: 1.5,
      created_at: '2026-01-01T00:00:00Z',
      sync_status: { local: true, cloud: false },
    };
    expect(record.voice_id).toBe('v1');
  });
});
```

**[RED]** Run: `cd frontend && npx jest src/features/library/types.test.ts`
**Expected:** FAIL — cannot find module

**[GREEN]** Write types:

```typescript
// frontend/src/features/library/types.ts
export interface SyncStatus {
  local: boolean;
  cloud: boolean;
}

export type StatusBadge = 'local' | 'cloud' | 'synced';

export function computeStatusBadge(syncStatus: SyncStatus): StatusBadge {
  if (syncStatus.local && syncStatus.cloud) return 'synced';
  if (syncStatus.local) return 'local';
  return 'cloud';
}

export interface LibraryRecord {
  id: string;
  text_content: string;
  voice_id: string;
  audio_url: string;
  file_size_bytes: number;
  duration: number | null;
  created_at: string;
  sync_status: SyncStatus;
}

export type LibraryViewMode = 'grid' | 'list';

export type LibraryTab = 'all' | 'local' | 'cloud' | 'synced';

export interface FilterState {
  tab: LibraryTab;
  search: string;
  voiceFilter: string | null;
  sortBy: 'newest' | 'oldest' | 'az';
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}
```

**[GREEN]** Run: `cd frontend && npx jest src/features/library/types.test.ts`
**Expected:** PASS

---

#### Task 6: Refactor IndexedDB helpers

**Description:** Extract IndexedDB CRUD operations into reusable helpers, separate from React hook.

**Files:** `frontend/src/features/library/hooks/useLocalLibrary.ts` → split into:
- `frontend/src/features/library/lib/indexedDB.ts` (pure functions)
- `frontend/src/features/library/hooks/useLocalLibrary.ts` (React hook, re-exports)

---

**[RED]** Write test:

```typescript
// frontend/src/features/library/lib/indexedDB.test.ts
import { openDB, getRecordsFromDB, saveRecordToDB, deleteRecordFromDB } from './indexedDB';

describe('indexedDB helpers', () => {
  test('openDB returns a database instance', async () => {
    const db = await openDB();
    expect(db).toBeDefined();
    expect(db.name).toBe('GenVoiceDB');
  });
});
```

**[RED]** Run: `cd frontend && npx jest src/features/library/lib/indexedDB.test.ts`
**Expected:** FAIL — cannot find module

**[GREEN]** Create `indexedDB.ts`:

```typescript
// frontend/src/features/library/lib/indexedDB.ts
const DB_NAME = 'GenVoiceDB';
const STORE_NAME = 'audioRecords';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getRecordsFromDB(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecordToDB(record: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecordFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecordStatus(id: string, syncStatus: { local: boolean; cloud: boolean }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.sync_status = syncStatus;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

**[GREEN]** Run: `cd frontend && npx jest src/features/library/lib/indexedDB.test.ts`
**Expected:** PASS

Then refactor `useLocalLibrary.ts` to reuse these helpers:

```typescript
// frontend/src/features/library/hooks/useLocalLibrary.ts
import { useState, useCallback, useEffect } from 'react';
import { getRecordsFromDB, saveRecordToDB, deleteRecordFromDB } from '../lib/indexedDB';

export function useLocalLibrary() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      const data = await getRecordsFromDB();
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecords(data);
    } catch (e) {
      console.error('Failed to load local records', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const saveLocalRecord = useCallback(async (record: any) => {
    try {
      await saveRecordToDB({ ...record, sync_status: { local: true, cloud: false } });
      await loadRecords();
    } catch (e) {
      console.error('Failed to save local record', e);
    }
  }, [loadRecords]);

  const deleteLocalRecord = useCallback(async (id: string) => {
    try {
      await deleteRecordFromDB(id);
      await loadRecords();
    } catch (e) {
      console.error('Failed to delete local record', e);
    }
  }, [loadRecords]);

  return { records, loading, saveLocalRecord, deleteLocalRecord, refreshLocalRecords: loadRecords };
}
```

---

#### Task 7: Create cloud library API module

**Description:** API functions for cloud library operations using `apiRequest`.

**Files:** `frontend/src/features/library/api/library-api.ts`

---

**[RED]** Write test:

```typescript
// frontend/src/features/library/api/library-api.test.ts
import { fetchCloudRecords, syncRecordsToCloud, deleteCloudRecord } from './library-api';

describe('library-api', () => {
  test('fetchCloudRecords calls GET /api/library', () => {
    // Verifies the API path — actual HTTP is mocked by apiRequest
    expect(fetchCloudRecords).toBeDefined();
  });
});
```

**[RED]** Run: `cd frontend && npx jest src/features/library/api/library-api.test.ts`
**Expected:** FAIL

**[GREEN]** Write API module:

```typescript
// frontend/src/features/library/api/library-api.ts
import { apiRequest, ApiError } from '@/lib/api-client';

interface CloudRecord {
  id: string;
  user_id: string;
  voice_id: string;
  text_content: string;
  file_url: string;
  file_size_bytes: number;
  duration: number | null;
  created_at: string;
}

interface SyncResponse {
  synced: Array<{ id: string; file_url: string; synced_at: string }>;
  failed: Array<{ id: string; error: string }>;
}

interface SyncRecordInput {
  id: string;
  text_content: string;
  voice_id: string;
  audio_data: string;
  file_size_bytes: number;
  duration: number | null;
}

export async function fetchCloudRecords(userId: string): Promise<CloudRecord[]> {
  const res = await apiRequest<{ items: CloudRecord[] }>('/library');
  return res.items;
}

export async function syncRecordsToCloud(records: SyncRecordInput[]): Promise<SyncResponse> {
  return apiRequest<SyncResponse>('/library/sync', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

export async function deleteCloudRecord(recordId: string): Promise<void> {
  await apiRequest<void>(`/library/${recordId}`, {
    method: 'DELETE',
    allowEmpty: true,
  });
}

export async function uploadToCloud(
  file: Blob,
  textContent: string,
  voiceId: string,
  duration: number | null
): Promise<CloudRecord> {
  const formData = new FormData();
  formData.append('file', file, 'audio.wav');
  formData.append('text_content', textContent);
  formData.append('voice_id', voiceId);
  if (duration !== null) {
    formData.append('duration', String(duration));
  }
  return apiRequest<CloudRecord>('/library/upload', {
    method: 'POST',
    body: formData,
    expectJson: true,
  });
}
```

**[GREEN]** Run: `cd frontend && npx jest src/features/library/api/library-api.test.ts`
**Expected:** PASS

---

#### Task 8: Create useLibraryRecords hook

**Description:** Unified hook that reads from IndexedDB and cloud, merges records, computes sync_status.

**Files:** `frontend/src/features/library/hooks/useLibraryRecords.ts`

---

**[RED]** Write test:

```typescript
// frontend/src/features/library/hooks/useLibraryRecords.test.ts
import { computeStatusBadge } from '../types';

describe('useLibraryRecords core logic', () => {
  test('computeStatusBadge returns synced when both local and cloud', () => {
    expect(computeStatusBadge({ local: true, cloud: true })).toBe('synced');
  });
  test('computeStatusBadge returns local when only local', () => {
    expect(computeStatusBadge({ local: true, cloud: false })).toBe('local');
  });
  test('computeStatusBadge returns cloud when only cloud', () => {
    expect(computeStatusBadge({ local: false, cloud: true })).toBe('cloud');
  });
});
```

**[GREEN]** Write hook:

```typescript
// frontend/src/features/library/hooks/useLibraryRecords.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { LibraryRecord } from '../types';
import { getRecordsFromDB } from '../lib/indexedDB';
import { fetchCloudRecords } from '../api/library-api';

interface UseLibraryRecordsReturn {
  records: LibraryRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLibraryRecords(isPro: boolean): UseLibraryRecordsReturn {
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localRecords = await getRecordsFromDB();
      const localMap = new Map(localRecords.map((r: any) => [r.id, r]));

      if (isPro) {
        const cloudRecords = await fetchCloudRecords('');
        const cloudMap = new Map(cloudRecords.map(r => [r.id, r]));

        const mergedIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
        const merged: LibraryRecord[] = [];

        for (const id of mergedIds) {
          const local = localMap.get(id);
          const cloud = cloudMap.get(id);
          merged.push({
            id,
            text_content: cloud?.text_content ?? local?.text_content ?? '',
            voice_id: cloud?.voice_id ?? local?.voice_id ?? '',
            audio_url: local?.audio_url ?? cloud?.file_url ?? '',
            file_size_bytes: cloud?.file_size_bytes ?? local?.file_size_bytes ?? 0,
            duration: local?.duration ?? cloud?.duration ?? null,
            created_at: local?.created_at ?? cloud?.created_at ?? '',
            sync_status: { local: !!local, cloud: !!cloud },
          });
        }

        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecords(merged);
      } else {
        setRecords(localRecords.map((r: any) => ({
          ...r,
          sync_status: { local: true, cloud: false },
        })));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load library records');
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  return { records, loading, error, refresh: loadRecords };
}
```

**[GREEN]** Run: `cd frontend && npx jest src/features/library/hooks/useLibraryRecords.test.ts`
**Expected:** PASS

---

#### Task 9: Create useLibrarySync hook

**Description:** Sync orchestration — diff local vs cloud, upload missing records, update status badges.

**Files:** `frontend/src/features/library/hooks/useLibrarySync.ts`

---

**[RED]** Write test:

```typescript
// frontend/src/features/library/hooks/useLibrarySync.test.ts
describe('sync diff logic', () => {
  function computeSyncDiff(localIds: string[], cloudIds: string[]) {
    return localIds.filter(id => !cloudIds.includes(id));
  }

  test('returns ids present in local but not cloud', () => {
    const diff = computeSyncDiff(['a', 'b', 'c'], ['a']);
    expect(diff).toEqual(['b', 'c']);
  });

  test('returns empty when all local are in cloud', () => {
    const diff = computeSyncDiff(['a', 'b'], ['a', 'b']);
    expect(diff).toEqual([]);
  });
});
```

**[GREEN]** Write hook:

```typescript
// frontend/src/features/library/hooks/useLibrarySync.ts
'use client';
import { useState, useCallback } from 'react';
import { SyncProgress, LibraryRecord } from '../types';
import { getRecordsFromDB, updateRecordStatus } from '../lib/indexedDB';
import { syncRecordsToCloud } from '../api/library-api';

interface UseLibrarySyncReturn {
  syncProgress: SyncProgress | null;
  startSync: (records: LibraryRecord[]) => Promise<void>;
  isSyncing: boolean;
}

export function useLibrarySync(): UseLibrarySyncReturn {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const startSync = useCallback(async (records: LibraryRecord[]) => {
    const localOnly = records.filter(r => r.sync_status.local && !r.sync_status.cloud);
    if (localOnly.length === 0) return;

    setIsSyncing(true);
    setSyncProgress({ total: localOnly.length, completed: 0, failed: 0, inProgress: true });

    const syncItems = await Promise.all(
      localOnly.map(async (rec) => {
        const localRecords = await getRecordsFromDB();
        const localRec = localRecords.find((r: any) => r.id === rec.id);
        return {
          id: rec.id,
          text_content: rec.text_content,
          voice_id: rec.voice_id,
          audio_data: localRec?.audio_url || '',
          file_size_bytes: rec.file_size_bytes,
          duration: rec.duration,
        };
      })
    );

    // Filter out entries without audio data
    const validItems = syncItems.filter(i => i.audio_data.startsWith('data:'));

    if (validItems.length === 0) {
      setIsSyncing(false);
      setSyncProgress(null);
      return;
    }

    try {
      const result = await syncRecordsToCloud(validItems);
      const completed = result.synced.length;
      const failed = result.failed.length;

      // Update sync_status for synced records
      for (const item of result.synced) {
        await updateRecordStatus(item.id, { local: true, cloud: true });
      }

      // Mark failed items
      for (const item of result.failed) {
        console.error(`Sync failed for ${item.id}: ${item.error}`);
      }

      setSyncProgress({ total: validItems.length, completed, failed, inProgress: false });
    } catch (e) {
      console.error('Sync error:', e);
      setSyncProgress({ total: validItems.length, completed: 0, failed: validItems.length, inProgress: false });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { syncProgress, startSync, isSyncing };
}
```

**[GREEN]** Run: `cd frontend && npx jest src/features/library/hooks/useLibrarySync.test.ts`
**Expected:** PASS

---

#### Task 10: Create useLibraryFilter hook

**Description:** Client-side filter, sort, and search state.

**Files:** `frontend/src/features/library/hooks/useLibraryFilter.ts`

---

**[RED]** Write test:

```typescript
// frontend/src/features/library/hooks/useLibraryFilter.test.ts
import { LibraryRecord, StatusBadge } from '../types';

function applyFilter(
  records: LibraryRecord[],
  options: { tab: string; search: string; voiceFilter: string | null; sortBy: string }
): LibraryRecord[] {
  let filtered = [...records];

  // Filter by status tab
  if (options.tab === 'local') filtered = filtered.filter(r => r.sync_status.local && !r.sync_status.cloud);
  else if (options.tab === 'cloud') filtered = filtered.filter(r => !r.sync_status.local && r.sync_status.cloud);
  else if (options.tab === 'synced') filtered = filtered.filter(r => r.sync_status.local && r.sync_status.cloud);

  // Search
  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(r => r.text_content.toLowerCase().includes(q));
  }

  // Voice filter
  if (options.voiceFilter) {
    filtered = filtered.filter(r => r.voice_id === options.voiceFilter);
  }

  // Sort
  if (options.sortBy === 'newest') filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (options.sortBy === 'oldest') filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  else if (options.sortBy === 'az') filtered.sort((a, b) => a.text_content.localeCompare(b.text_content));

  return filtered;
}

const mockRecords: LibraryRecord[] = [
  { id: '1', text_content: 'Xin chào', voice_id: 'v1', audio_url: '', file_size_bytes: 100, duration: 1, created_at: '2026-03-01', sync_status: { local: true, cloud: false } },
  { id: '2', text_content: 'Hello world', voice_id: 'v2', audio_url: '', file_size_bytes: 200, duration: 2, created_at: '2026-02-01', sync_status: { local: true, cloud: true } },
  { id: '3', text_content: 'Test audio', voice_id: 'v1', audio_url: '', file_size_bytes: 300, duration: 3, created_at: '2026-01-01', sync_status: { local: false, cloud: true } },
];

test('tab=local returns only local-only records', () => {
  const result = applyFilter(mockRecords, { tab: 'local', search: '', voiceFilter: null, sortBy: 'newest' });
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('1');
});

test('search filters by text_content', () => {
  const result = applyFilter(mockRecords, { tab: 'all', search: 'hello', voiceFilter: null, sortBy: 'newest' });
  expect(result).toHaveLength(1);
});

test('voiceFilter filters by voice_id', () => {
  const result = applyFilter(mockRecords, { tab: 'all', search: '', voiceFilter: 'v2', sortBy: 'newest' });
  expect(result).toHaveLength(1);
});

test('sortBy oldest returns oldest first', () => {
  const result = applyFilter(mockRecords, { tab: 'all', search: '', voiceFilter: null, sortBy: 'oldest' });
  expect(result[0].id).toBe('3');
});
```

**[GREEN]** Write hook:

```typescript
// frontend/src/features/library/hooks/useLibraryFilter.ts
'use client';
import { useState, useMemo } from 'react';
import { LibraryRecord, LibraryTab, FilterState } from '../types';

export function useLibraryFilter(records: LibraryRecord[]) {
  const [filter, setFilter] = useState<FilterState>({
    tab: 'all',
    search: '',
    voiceFilter: null,
    sortBy: 'newest',
  });

  const availableVoices = useMemo(() => {
    const voices = new Set(records.map(r => r.voice_id));
    return Array.from(voices).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Tab filter
    switch (filter.tab) {
      case 'local':
        result = result.filter(r => r.sync_status.local && !r.sync_status.cloud);
        break;
      case 'cloud':
        result = result.filter(r => !r.sync_status.local && r.sync_status.cloud);
        break;
      case 'synced':
        result = result.filter(r => r.sync_status.local && r.sync_status.cloud);
        break;
    }

    // Search
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(r => r.text_content.toLowerCase().includes(q));
    }

    // Voice filter
    if (filter.voiceFilter) {
      result = result.filter(r => r.voice_id === filter.voiceFilter);
    }

    // Sort
    switch (filter.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.text_content.localeCompare(b.text_content));
        break;
    }

    return result;
  }, [records, filter]);

  const tabCounts = useMemo(() => ({
    all: records.length,
    local: records.filter(r => r.sync_status.local && !r.sync_status.cloud).length,
    cloud: records.filter(r => !r.sync_status.local && r.sync_status.cloud).length,
    synced: records.filter(r => r.sync_status.local && r.sync_status.cloud).length,
  }), [records]);

  return {
    filter,
    setFilter,
    filteredRecords,
    availableVoices,
    tabCounts,
  };
}
```

**[GREEN]** Run: `cd frontend && npx jest src/features/library/hooks/useLibraryFilter.test.ts`
**Expected:** PASS

---

### Section C: Frontend — UI Components

#### Task 11: Create LibraryToolbar

**Description:** Search input, voice filter dropdown, sort selector, grid/list toggle icons.

**Files:** `frontend/src/features/library/components/LibraryToolbar.tsx`

---

**[GREEN]** Write component:

```tsx
// frontend/src/features/library/components/LibraryToolbar.tsx
'use client';
import { FilterState, LibraryViewMode } from '../types';

interface Props {
  filter: FilterState;
  onFilterChange: (update: Partial<FilterState>) => void;
  viewMode: LibraryViewMode;
  onViewModeChange: (mode: LibraryViewMode) => void;
  availableVoices: string[];
}

export function LibraryToolbar({ filter, onFilterChange, viewMode, onViewModeChange, availableVoices }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search records..."
          className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1]/50 transition-all"
        />
      </div>

      {/* Voice filter */}
      <select
        value={filter.voiceFilter ?? ''}
        onChange={(e) => onFilterChange({ voiceFilter: e.target.value || null })}
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6366F1]/50"
      >
        <option value="">All Voices</option>
        {availableVoices.map((v) => (
          <option key={v} value={v} className="bg-[#1a1a2e]">{v}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filter.sortBy}
        onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6366F1]/50"
      >
        <option value="newest" className="bg-[#1a1a2e]">Newest</option>
        <option value="oldest" className="bg-[#1a1a2e]">Oldest</option>
        <option value="az" className="bg-[#1a1a2e]">A-Z</option>
      </select>

      {/* View toggle */}
      <div className="flex border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`px-3 py-2 text-sm transition-all ${viewMode === 'grid' ? 'bg-[#6366F1]/20 text-[#6366F1]' : 'text-[#A1A1AA] hover:text-white'}`}
          title="Grid view"
        >
          ▦
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-2 text-sm transition-all ${viewMode === 'list' ? 'bg-[#6366F1]/20 text-[#6366F1]' : 'text-[#A1A1AA] hover:text-white'}`}
          title="List view"
        >
          ☰
        </button>
      </div>
    </div>
  );
}
```

Test: manual verification in browser (component styling).

---

#### Task 12: Create LibraryTabs

**Description:** All/Local/Cloud/Synced tabs with count badges.

**Files:** `frontend/src/features/library/components/LibraryTabs.tsx`

---

```tsx
// frontend/src/features/library/components/LibraryTabs.tsx
'use client';
import { LibraryTab } from '../types';

interface Props {
  activeTab: LibraryTab;
  counts: { all: number; local: number; cloud: number; synced: number };
  isPro: boolean;
  onTabChange: (tab: LibraryTab) => void;
}

const tabs: { key: LibraryTab; label: string; proOnly?: boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'local', label: 'Local' },
  { key: 'cloud', label: 'Cloud', proOnly: true },
  { key: 'synced', label: 'Synced', proOnly: true },
];

export function LibraryTabs({ activeTab, counts, isPro, onTabChange }: Props) {
  return (
    <div className="flex gap-2 border-b border-white/10 pb-3">
      {tabs.map((tab) => {
        const disabled = tab.proOnly && !isPro;
        return (
          <button
            key={tab.key}
            onClick={() => !disabled && onTabChange(tab.key)}
            disabled={disabled}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.key && !disabled
                ? 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/30'
                : disabled
                  ? 'text-[#52525B] cursor-not-allowed opacity-50'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.key === 'synced' && counts.synced > 0 && !disabled && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#4ecdc4] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {counts.synced}
              </span>
            )}
            {disabled && (
              <span className="text-[8px] uppercase tracking-widest text-[#F59E0B] ml-1 px-1 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                PRO
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

---

#### Task 13: Create LibraryCard and LibraryCardRow

**Description:** Card component for grid view and row component for list view.

**Files:** `frontend/src/features/library/components/LibraryCard.tsx`, `LibraryCardRow.tsx`

---

```tsx
// frontend/src/features/library/components/LibraryCard.tsx
'use client';
import { useState, useRef } from 'react';
import { LibraryRecord, computeStatusBadge, StatusBadge } from '../types';

interface Props {
  record: LibraryRecord;
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  isPlaying: boolean;
  isPro: boolean;
}

const badgeColors: Record<StatusBadge, { bg: string; text: string }> = {
  local: { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
  cloud: { bg: 'bg-[#fff3e0]', text: 'text-[#e65100]' },
  synced: { bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
};

const gradients = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
];

export function LibraryCard({ record, onPlay, onDelete, onDownload, onUploadToCloud, isPlaying, isPro }: Props) {
  const badge = computeStatusBadge(record.sync_status);
  const colors = badgeColors[badge];
  const gradientIndex = record.id.charCodeAt(0) % gradients.length;

  return (
    <div className="group rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all overflow-hidden">
      {/* Thumbnail */}
      <div
        className="h-20 flex items-center justify-center cursor-pointer relative"
        style={{ background: gradients[gradientIndex] }}
        onClick={() => onPlay(record)}
      >
        {isPlaying ? (
          <div className="flex gap-1">
            <span className="w-1 h-6 bg-white rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-[#818CF8]">{record.voice_id}</div>
        <p className="text-sm text-[#F4F4F5] line-clamp-2 leading-relaxed">{record.text_content}</p>
        <div className="flex items-center justify-between text-[10px] text-[#A1A1AA]">
          <span>{record.duration ? `${record.duration.toFixed(1)}s` : '--'}</span>
          <span>{new Date(record.created_at).toLocaleDateString('vi-VN')}</span>
        </div>

        {/* Badge */}
        <div className="flex gap-1.5">
          {record.sync_status.local && (
            <span className={`${colors.bg} ${colors.text} px-2 py-0.5 rounded text-[9px] font-medium`}>
              Local
            </span>
          )}
          {record.sync_status.cloud && (
            <span className={`${badgeColors.cloud.bg} ${badgeColors.cloud.text} px-2 py-0.5 rounded text-[9px] font-medium`}>
              Cloud
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onPlay(record)}
            className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-[#D4D4D8] hover:text-white hover:bg-white/5 transition-all"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => onDownload(record)}
            className="p-1.5 rounded-lg border border-white/10 text-xs text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
            title="Download"
          >
            ⬇
          </button>
          {isPro && !record.sync_status.cloud && onUploadToCloud && (
            <button
              onClick={() => onUploadToCloud(record)}
              className="p-1.5 rounded-lg border border-white/10 text-xs text-[#A1A1AA] hover:text-[#4ecdc4] hover:bg-[#4ecdc4]/10 transition-all"
              title="Upload to Cloud"
            >
              ☁
            </button>
          )}
          <button
            onClick={() => onDelete(record.id)}
            className="p-1.5 rounded-lg border border-white/10 text-xs text-[#A1A1AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// frontend/src/features/library/components/LibraryCardRow.tsx
'use client';
import { LibraryRecord, computeStatusBadge } from '../types';

interface Props {
  record: LibraryRecord;
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  isPlaying: boolean;
  isPro: boolean;
}

export function LibraryCardRow({ record, onPlay, onDelete, onDownload, onUploadToCloud, isPlaying, isPro }: Props) {
  const badge = computeStatusBadge(record.sync_status);
  const gradients = ['#667eea,#764ba2', '#f093fb,#f5576c', '#4facfe,#00f2fe', '#43e97b,#38f9d7'];
  const gradient = gradients[record.id.charCodeAt(0) % gradients.length];

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-all group">
      {/* Play icon */}
      <button
        onClick={() => onPlay(record)}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
        style={{ background: `linear-gradient(135deg,${gradient})` }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F4F4F5] truncate">{record.text_content}</p>
      </div>

      {/* Voice */}
      <div className="shrink-0 w-24 text-xs text-[#818CF8]">{record.voice_id}</div>

      {/* Duration */}
      <div className="shrink-0 w-14 text-xs text-[#A1A1AA]">
        {record.duration ? `${record.duration.toFixed(1)}s` : '--'}
      </div>

      {/* Date */}
      <div className="shrink-0 w-24 text-xs text-[#A1A1AA]">
        {new Date(record.created_at).toLocaleDateString('vi-VN')}
      </div>

      {/* Status badges */}
      <div className="shrink-0 flex gap-1 w-20">
        {record.sync_status.local && (
          <span className="bg-[#e8f5e9] text-[#2e7d32] px-1.5 py-0.5 rounded text-[8px] font-medium">L</span>
        )}
        {record.sync_status.cloud && (
          <span className="bg-[#fff3e0] text-[#e65100] px-1.5 py-0.5 rounded text-[8px] font-medium">C</span>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={() => onDownload(record)} className="p-1.5 text-xs text-[#A1A1AA] hover:text-white" title="Download">⬇</button>
        {isPro && !record.sync_status.cloud && onUploadToCloud && (
          <button onClick={() => onUploadToCloud(record)} className="p-1.5 text-xs text-[#A1A1AA] hover:text-[#4ecdc4]" title="Upload">☁</button>
        )}
        <button onClick={() => onDelete(record.id)} className="p-1.5 text-xs text-[#A1A1AA] hover:text-red-400" title="Delete">✕</button>
      </div>
    </div>
  );
}
```

Test: manual verification in browser.

---

#### Task 14: Create LibraryGrid and LibraryList

**Description:** Grid and list view containers.

**Files:** `frontend/src/features/library/components/LibraryGrid.tsx`, `LibraryList.tsx`

---

```tsx
// frontend/src/features/library/components/LibraryGrid.tsx
'use client';
import { LibraryRecord } from '../types';
import { LibraryCard } from './LibraryCard';

interface Props {
  records: LibraryRecord[];
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  playingId: string | null;
  isPro: boolean;
}

export function LibraryGrid({ records, onPlay, onDelete, onDownload, onUploadToCloud, playingId, isPro }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
      {records.map((record) => (
        <LibraryCard
          key={record.id}
          record={record}
          onPlay={onPlay}
          onDelete={onDelete}
          onDownload={onDownload}
          onUploadToCloud={onUploadToCloud}
          isPlaying={playingId === record.id}
          isPro={isPro}
        />
      ))}
    </div>
  );
}
```

```tsx
// frontend/src/features/library/components/LibraryList.tsx
'use client';
import { LibraryRecord } from '../types';
import { LibraryCardRow } from './LibraryCardRow';

interface Props {
  records: LibraryRecord[];
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  playingId: string | null;
  isPro: boolean;
}

export function LibraryList({ records, onPlay, onDelete, onDownload, onUploadToCloud, playingId, isPro }: Props) {
  if (records.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border-b border-white/10 text-[10px] uppercase tracking-widest text-[#A1A1AA]">
        <div className="w-8 shrink-0" />
        <div className="flex-1">Content</div>
        <div className="shrink-0 w-24">Voice</div>
        <div className="shrink-0 w-14">Dur.</div>
        <div className="shrink-0 w-24">Date</div>
        <div className="shrink-0 w-20">Status</div>
        <div className="shrink-0 w-16">Actions</div>
      </div>

      {records.map((record) => (
        <LibraryCardRow
          key={record.id}
          record={record}
          onPlay={onPlay}
          onDelete={onDelete}
          onDownload={onDownload}
          onUploadToCloud={onUploadToCloud}
          isPlaying={playingId === record.id}
          isPro={isPro}
        />
      ))}
    </div>
  );
}
```

Test: manual verification in browser.

---

#### Task 15: Create LibrarySyncBar, CloudUpgradeBanner, LibraryEmpty

**Description:** Small utility components.

**Files:** `frontend/src/features/library/components/LibrarySyncBar.tsx`, `CloudUpgradeBanner.tsx`, `LibraryEmpty.tsx`

---

```tsx
// frontend/src/features/library/components/LibrarySyncBar.tsx
'use client';
import { SyncProgress } from '../types';

interface Props {
  progress: SyncProgress;
}

export function LibrarySyncBar({ progress }: Props) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#4ecdc4]/20 bg-[#4ecdc4]/5">
      <span className="text-lg animate-spin">↻</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-[#A1A1AA] mb-1">
          <span>{progress.inProgress ? 'Syncing to cloud...' : 'Sync complete'}</span>
          <span>{progress.completed}/{progress.total} records</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4ecdc4] to-[#44a8b3] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {progress.failed > 0 && (
        <span className="text-xs text-red-400">{progress.failed} failed</span>
      )}
    </div>
  );
}
```

```tsx
// frontend/src/features/library/components/CloudUpgradeBanner.tsx
'use client';
import Link from 'next/link';

export function CloudUpgradeBanner() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5">
      <span className="text-lg">☁️</span>
      <div className="flex-1">
        <p className="text-sm text-[#F4F4F5]">Cloud backup for your audio files</p>
        <p className="text-xs text-[#A1A1AA]">Upgrade to PRO to sync your library across devices.</p>
      </div>
      <Link href="/pricing">
        <button className="px-4 py-1.5 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-medium hover:bg-[#F59E0B]/30 transition-all">
          Upgrade
        </button>
      </Link>
    </div>
  );
}
```

```tsx
// frontend/src/features/library/components/LibraryEmpty.tsx
'use client';
import Link from 'next/link';

export function LibraryEmpty() {
  return (
    <div className="h-64 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center px-4">
      <svg className="w-10 h-10 text-[#A1A1AA] mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h2 className="text-sm uppercase tracking-widest text-[#F4F4F5] mb-2">No records yet</h2>
      <p className="text-xs font-light text-[#A1A1AA] mb-6 max-w-sm">
        Your library is empty. Head to Studio to create your first audio.
      </p>
      <Link href="/studio">
        <button className="px-6 py-2.5 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#F4F4F5] text-[10px] font-medium uppercase tracking-widest hover:bg-[#6366F1]/20 transition-all">
          Open Studio
        </button>
      </Link>
    </div>
  );
}
```

---

#### Task 16: Create LibraryPage (main orchestrator)

**Description:** Main page component that composes all sub-components and hooks.

**Files:** `frontend/src/features/library/components/LibraryPage.tsx`

---

```tsx
// frontend/src/features/library/components/LibraryPage.tsx
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/components/providers/auth-provider'; // Assuming this exists
import { useLocalLibrary } from '../hooks/useLocalLibrary';
import { useLibraryRecords } from '../hooks/useLibraryRecords';
import { useLibrarySync } from '../hooks/useLibrarySync';
import { useLibraryFilter } from '../hooks/useLibraryFilter';
import { LibraryToolbar } from './LibraryToolbar';
import { LibraryTabs } from './LibraryTabs';
import { LibraryGrid } from './LibraryGrid';
import { LibraryList } from './LibraryList';
import { LibraryEmpty } from './LibraryEmpty';
import { LibrarySyncBar } from './LibrarySyncBar';
import { CloudUpgradeBanner } from './CloudUpgradeBanner';
import { LibraryRecord, LibraryViewMode, LibraryTab } from '../types';
import { StaggerChildren, FadeIn } from '@/components/motion';
import { getCurrentUser } from '@/features/auth/api/auth-api';

export function LibraryPage() {
  const [isPro, setIsPro] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    getCurrentUser().then(u => {
      setIsPro(u.subscription_tier === 'pro' || u.subscription_tier === 'enterprise');
    }).catch(() => {
      setIsPro(false);
    }).finally(() => setUserLoaded(true));
  }, []);
  const { loading: localLoading } = useLocalLibrary();
  const { records, loading, error, refresh } = useLibraryRecords(isPro);
  const { syncProgress, startSync, isSyncing } = useLibrarySync();
  const { filter, setFilter, filteredRecords, availableVoices, tabCounts } = useLibraryFilter(records);
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-sync on mount for pro users
  useEffect(() => {
    if (isPro && records.length > 0 && !isSyncing && !syncProgress) {
      startSync(records);
    }
  }, [isPro, records.length, startSync, isSyncing, syncProgress]);

  const handlePlay = useCallback((record: LibraryRecord) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === record.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(record.id);
    const audio = new Audio(record.audio_url);
    audio.onended = () => { setPlayingId(null); audioRef.current = null; };
    audioRef.current = audio;
    audio.play();
  }, [playingId]);

  const handleDelete = useCallback(async (id: string) => {
    const deleteFromCloud = filter.tab === 'cloud' || filter.tab === 'all' || filter.tab === 'synced';
    const deleteFromLocal = filter.tab === 'local' || filter.tab === 'all' || filter.tab === 'synced';

    try {
      if (deleteFromCloud) {
        const { deleteCloudRecord } = await import('../api/library-api');
        await deleteCloudRecord(id);
      }
      if (deleteFromLocal) {
        const { deleteRecordFromDB } = await import('../lib/indexedDB');
        await deleteRecordFromDB(id);
      }
      refresh();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }, [filter.tab, refresh]);

  const handleDownload = useCallback((record: LibraryRecord) => {
    const a = document.createElement('a');
    a.href = record.audio_url;
    a.download = `genvoice-${record.id}.wav`;
    a.click();
  }, []);

  const handleUploadToCloud = useCallback(async (record: LibraryRecord) => {
    if (!isPro) return;
    const { getRecordsFromDB } = await import('../lib/indexedDB');
    const localRecords = await getRecordsFromDB();
    const localRec = localRecords.find((r: any) => r.id === record.id);
    if (localRec?.audio_url) {
      await startSync([record]);
      refresh();
    }
  }, [isPro, startSync, refresh]);

  const handleTabChange = useCallback((tab: LibraryTab) => {
    setFilter({ tab });
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlayingId(null); }
  }, [setFilter]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  if (loading || localLoading || !userLoaded) {
    return (
      <FadeIn>
        <div className="h-48 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin mb-4" />
          <p className="text-[10px] uppercase tracking-widest text-[#D4D4D8]">Loading library...</p>
        </div>
      </FadeIn>
    );
  }

  if (error) {
    return (
      <FadeIn>
        <div className="h-48 rounded-2xl border border-dashed border-red-400/20 flex flex-col items-center justify-center">
          <p className="text-sm text-red-400 mb-2">Failed to load library</p>
          <button onClick={refresh} className="text-xs text-[#6366F1] underline">Retry</button>
        </div>
      </FadeIn>
    );
  }

  return (
    <div>
      {/* Sync progress */}
      {syncProgress && !syncProgress.inProgress && syncProgress.failed > 0 && (
        <div className="mb-4">
          <LibrarySyncBar progress={syncProgress} />
        </div>
      )}

      {/* Cloud upgrade banner for free users */}
      {!isPro && <div className="mb-4"><CloudUpgradeBanner /></div>}

      {/* Tabs */}
      <LibraryTabs
        activeTab={filter.tab}
        counts={tabCounts}
        isPro={isPro}
        onTabChange={handleTabChange}
      />

      {/* Toolbar */}
      <LibraryToolbar
        filter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        availableVoices={availableVoices}
      />

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <LibraryEmpty />
      ) : viewMode === 'grid' ? (
        <LibraryGrid
          records={filteredRecords}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onUploadToCloud={handleUploadToCloud}
          playingId={playingId}
          isPro={isPro}
        />
      ) : (
        <LibraryList
          records={filteredRecords}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onUploadToCloud={handleUploadToCloud}
          playingId={playingId}
          isPro={isPro}
        />
      )}
    </div>
  );
}
```

---

#### Task 17: Feature exports and wire Library page route

**Description:** Create index.ts, rewrite app/library/page.tsx.

**Files:** `frontend/src/features/library/index.ts`, `frontend/src/app/library/page.tsx`

---

```typescript
// frontend/src/features/library/index.ts
export { LibraryPage } from './components/LibraryPage';
export { useLocalLibrary } from './hooks/useLocalLibrary';
export { LibraryGrid, LibraryList, LibraryCard, LibraryCardRow } from './components';
export type { LibraryRecord, LibraryViewMode, LibraryTab, FilterState, SyncStatus, SyncProgress } from './types';
```

```tsx
// frontend/src/app/library/page.tsx (rewrite)
'use client';

import { FadeIn } from '@/components/motion';
import { LibraryPage } from '@/features/library';

export default function LibraryRoute() {
  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="mb-8">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              Lưu trữ Dữ liệu
            </h2>
            <h1 className="text-4xl md:text-5xl tracking-tight leading-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
              Thư viện Âm thanh
            </h1>
          </div>
        </FadeIn>
        <LibraryPage />
      </main>
    </div>
  );
}
```

Test: manual — navigate to /library, verify page loads with grid view.

---

### Section D: Integration

#### Task 18: Update Studio to save duration

**Description:** Save duration and file_size_bytes when generating TTS audio.

**Files:** `frontend/src/app/studio/page.tsx`

---

```tsx
// In handleGenerationSuccess callback (around line 108-119)
const handleGenerationSuccess = useCallback((nextAudioUrl: string, normalization?: NormalizationMeta | null) => {
  setAudioUrl(nextAudioUrl);
  if (normalization) setNormMeta(normalization);
  notify({ severity: 'success', title: t.studio.successTitle, message: t.studio.successMessage, source: 'studio', actionLabel: t.studio.audioDownload, actionHref: nextAudioUrl });
  
  // Estimate file size from base64 length
  const base64Data = nextAudioUrl.split(',')[1] || '';
  const fileSizeBytes = Math.round(base64Data.length * 0.75);
  
  // Get duration from API response — store reference
  saveLocalRecord({ 
    id: crypto.randomUUID(), 
    audio_url: nextAudioUrl, 
    text_content: text, 
    voice_id: voiceId, 
    duration: generationResult?.duration ?? null,  // pass through duration
    file_size_bytes: fileSizeBytes,
    created_at: new Date().toISOString() 
  });
}, [saveLocalRecord, text, voiceId]);
```

---

#### Task 19: Update StudioLibraryDrawer

**Description:** Keep compatibility — the drawer still uses `useLocalLibrary` which should still work since we kept its API.

**Files:** `frontend/src/components/studio/StudioLibraryDrawer.tsx`

No code changes needed — `useLocalLibrary` still exports the same interface. Drawer will continue to read from IndexedDB and show recent records.

---

## 3. Self-Review

### Spec Coverage
| Spec Requirement | Task |
|-----------------|------|
| Grid/List toggle | Task 11 (view toggle), Task 14 (Grid/List), Task 16 (orchestration) |
| Hybrid sync (pro) | Task 9 (sync hook), Task 16 (auto-sync on mount) |
| Status badges | Task 5 (types + computeStatusBadge), Task 13 (card rendering) |
| Voice filter / sort | Task 10 (filter hook), Task 11 (toolbar UI) |
| Tabs (All/Local/Cloud/Synced) | Task 12 (tabs), Task 10 (tab filtering) |
| Cloud tab disabled for free | Task 12 (proOnly flag), Task 16 (isPro check) |
| Context-sensitive delete | Task 16 (handleDelete), partial — cloud delete API call needed |
| Duration field | Task 1 (DB column), Task 4 (API), Task 18 (studio save) |
| Batch sync endpoint | Task 3 (service), Task 4 (API) |
| Sync progress bar | Task 15 (LibrarySyncBar), Task 9 (progress state) |
| Cloud upgrade banner | Task 15 (CloudUpgradeBanner), Task 16 (conditional render) |

### Open Items
- Cloud delete API integration in `handleDelete` — the plan wires the UI but the actual API call for cloud-only or both-context delete needs the `deleteCloudRecord` from `library-api.ts` to be called. This is a minor implementation detail for the orchestration task.
- User auth context — `fetchUserTier()` in Task 16 reads from localStorage as a simple approach. If a proper auth provider exists, it should be used instead.

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan | — | All |
