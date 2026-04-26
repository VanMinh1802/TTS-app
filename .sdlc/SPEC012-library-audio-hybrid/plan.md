# Audio Library (Hybrid Model) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hybrid Audio Library where all users can save generated audio locally (IndexedDB), and PRO users can upload to Cloudflare R2 (consuming quota).

**Architecture:** 
- **Backend:** A new `audio_records` Postgres table, a `LibraryService` for uploading to R2 and validating against `QuotaService`, and an API router `/api/library`.
- **Frontend:** Uses `localforage` to save Base64 audio blobs locally after generation in Studio. A new `/library` page shows Local and Cloud tabs, with a "Save to Cloud" button gated by PRO tier.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js, localforage, React Query.

---

## Part 1: Backend Database & Schema

### Task 1: Create AudioRecord SQLAlchemy Model
**Files:** `backend/app/models/audio_record.py`

- [ ] Create `AudioRecord` class inheriting from `Base`
- [ ] Add columns: `id` (UUID), `user_id` (String, ForeignKey to users.id), `voice_id` (String), `text_content` (Text), `file_url` (String), `file_size_bytes` (Integer), `created_at` (DateTime, default utcnow).

### Task 2: Create Library Pydantic Schemas
**Files:** `backend/app/schemas/library.py`

- [ ] Create `AudioRecordResponse` with fields matching the DB model (id, user_id, voice_id, text_content, file_url, file_size_bytes, created_at).
- [ ] Create `LibraryListResponse` containing `items: list[AudioRecordResponse]`.

---

## Part 3: Backend Services

### Task 3: Create Library Service
**Files:** `backend/app/services/library_service.py`

- [ ] Create `LibraryService` class initialized with `db: Session`.
- [ ] Implement `upload_to_cloud(user_id, file_bytes, text_content, voice_id)`:
  - Check user quota via `QuotaService.check_quota("storage", file_size)`. Raise 403/429 if not enough.
  - Upload file bytes to R2 using existing S3 client config (bucket `genvoice-models`, path `audio/{user_id}/{uuid}.wav`).
  - Consume quota: `QuotaService.consume_quota("storage", file_size)`. (Convert bytes to MB if needed, or track accurately).
  - Create and save `AudioRecord` to DB.
  - Return the created record.
- [ ] Implement `list_user_records(user_id)` returning records ordered by `created_at` DESC.
- [ ] Implement `delete_record(user_id, record_id)`:
  - Find record.
  - Delete from R2.
  - Refund quota (consume negative amount).
  - Delete from DB.

---

## Part 4: Backend API Endpoints

### Task 4: Create Library API Router
**Files:** `backend/app/api/library.py`, `backend/app/main.py`

- [ ] Create router `/library`.
- [ ] Add `POST /upload` endpoint accepting `UploadFile`, `text_content`, `voice_id`. Use `Depends(get_current_user)`. Require Pro tier check.
- [ ] Add `GET /` endpoint returning `list_user_records`.
- [ ] Add `DELETE /{record_id}` endpoint.
- [ ] Register router in `main.py` with `prefix=settings.API_V1_PREFIX`.

---

## Part 5: Frontend Local History (IndexedDB)

### Task 5: Setup localforage hook
**Files:** `frontend/src/features/library/hooks/useLocalLibrary.ts`

- [ ] Install `localforage` if not present (`npm install localforage`).
- [ ] Create a hook that wraps localforage to manage local audio records.
- [ ] Methods: `saveLocalRecord({ id, audioBase64, text, voiceId, createdAt })`, `getLocalRecords()`, `deleteLocalRecord(id)`.

### Task 6: Auto-save generated audio in Studio
**Files:** `frontend/src/app/studio/page.tsx`

- [ ] Import `useLocalLibrary`.
- [ ] Inside the `handleGenerate` success block, immediately call `saveLocalRecord` to store the generated Base64 audio into IndexedDB.

---

## Part 6: Frontend Cloud API & Hooks

### Task 7: Create Library API client & React Query hooks
**Files:** `frontend/src/features/library/api/library-api.ts`, `frontend/src/features/library/hooks/useCloudLibrary.ts`

- [ ] `uploadToCloud(file: Blob, text: string, voiceId: string)` using `fetch` with FormData and Bearer token.
- [ ] `getCloudRecords()` using `apiRequest`.
- [ ] `deleteCloudRecord(id)` using `apiRequest`.
- [ ] Create `useCloudLibrary` React Query hooks (`useQuery` for listing, `useMutation` for upload/delete).

---

## Part 7: Library UI

### Task 8: Build the Library Page
**Files:** `frontend/src/app/library/page.tsx`

- [ ] Create a modern Neo-Brutalism UI for the Library.
- [ ] Add Tabs: "Local History" and "Cloud Storage".
- [ ] **Local History Tab:** Render list from `useLocalLibrary`. Each item has a Play button, Delete button, and "Save to Cloud" button.
- [ ] "Save to Cloud" logic: If user is Pro, upload the local audio blob to Cloud using `uploadToCloud` mutation, then optionally delete from local or mark as saved. If user is Free, show a locked icon/toast telling them to upgrade.
- [ ] **Cloud Storage Tab:** Render list from `useCloudLibrary`. Play button, Delete button.
- [ ] Add `/library` to the main Navbar.
