# Specification: Audio Library (Hybrid Model)

## 1. Overview
The Audio Library feature allows users to access their previously generated TTS audio files. To optimize server costs while providing a premium experience for paid users, we will implement a Hybrid Model:
- **Free Users:** All generated audio is saved locally to their browser's IndexedDB.
- **Pro Users:** Can optionally upload ("Save to Cloud") specific audio files to Cloudflare R2 for permanent, cross-device storage, which will consume their Storage Quota.

## 2. Scope
- Frontend: IndexedDB integration for local history, `/library` UI with two tabs, update TTS Studio to auto-save to local history.
- Backend: API endpoints for Cloud Library management, R2 integration, Postgres table for metadata.
- Out of scope: Voice Cloning, Public Sharing Links (will be added in a future spec if needed).

## 3. Architecture
### 3.1. Frontend (Local History)
- **Library:** `localforage` (wrapper for IndexedDB).
- **Auto-save:** After a successful `POST /api/tts/generate`, the frontend will download the Base64 audio, convert it to a Blob, and save it to IndexedDB along with metadata (text, voice_id, timestamp).
- **UI:** A new route `/library`.
  - **Tab 1 (Local):** Reads from IndexedDB. Shows a list of recent generations. Has a "Save to Cloud ☁️" button. If `tier !== 'pro'`, the button shows a lock icon and triggers an upgrade modal.
  - **Tab 2 (Cloud):** Fetches from `GET /api/library`. Shows files stored on R2. Has a "Delete" button.

### 3.2. Backend (Cloud Storage)
- **Table `audio_records`:**
  - `id`: UUID (Primary Key)
  - `user_id`: String (Foreign Key)
  - `voice_id`: String
  - `text_content`: Text
  - `file_url`: String (R2 public URL or relative path)
  - `file_size_bytes`: Integer
  - `created_at`: DateTime
- **R2 Storage:** Files will be uploaded to `genvoice-models/audio/{user_id}/{uuid}.wav`.

## 4. API Endpoints
**1. POST /api/library/upload**
- **Auth:** Bearer Token.
- **Access Control:** `user.tier == 'pro'` (Wait, tier is in QuotaService. We will check `QuotaService.get_or_create_quota(user.id).tier == 'pro'`).
- **Body:** `multipart/form-data` containing the audio file and metadata (text, voice_id).
- **Logic:** 
  1. Check tier == 'pro'.
  2. Check `QuotaService.check_quota("storage", file_size)`.
  3. Upload to R2.
  4. Save to `audio_records` DB.
  5. `QuotaService.consume_quota("storage", file_size)`.
- **Response:** 200 OK, returns the DB record.

**2. GET /api/library**
- **Auth:** Bearer Token.
- **Logic:** Returns list of `audio_records` for the current user, ordered by `created_at` DESC.

**3. DELETE /api/library/{id}**
- **Auth:** Bearer Token.
- **Logic:** 
  1. Find record, verify ownership.
  2. Delete from R2.
  3. `QuotaService.consume_quota("storage", -file_size)` (Refund quota).
  4. Delete DB record.

## 5. Implementation Considerations
- **Storage Quota:** `storage_used_mb` is tracked in MB. Audio files are usually small (a few hundred KBs). We need to track `file_size_bytes` in DB and sum them up or manage fractional MBs. Alternatively, QuotaService handles MB, so we might need to update the logic to handle Bytes accurately.
- **IndexedDB Cleanup:** Consider adding a limit (e.g., max 100 items locally) to prevent the browser from running out of storage.
