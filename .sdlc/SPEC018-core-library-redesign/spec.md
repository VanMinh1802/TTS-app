# Feature: Library UI Redesign & Hybrid Cloud Sync

> **Status:** Review
> **Author:** Kilo
> **Date:** 2026-05-04
> **Related Issues:** Supersedes SPEC012

---

## 1. Problem Statement

### 1.1 User Problem

The current Library page shows audio records in a plain list with only play/delete actions. Free users have no visibility into cloud backup benefits, and pro users cannot leverage their cloud storage quota. Records are stored as large base64 blobs in IndexedDB with no cloud sync, causing data loss risk and no cross-device access.

### 1.2 Business Impact

- Pro users cannot utilize cloud storage they paid for, reducing perceived value
- No visual differentiation between free and pro tiers in the Library
- All data is device-local with no backup, leading to potential data loss
- Current IndexedDB-only approach stores massive base64 WAV blobs, wasting browser storage

### 1.3 Success Criteria

- [ ] Free users see clear upgrade path to pro via cloud feature badges
- [ ] Pro users' records auto-sync to cloud on Library page load
- [ ] Status badges (Local/Cloud/Synced) accurately reflect record state
- [ ] Grid/list view toggle works with smooth transitions
- [ ] Filter by voice and sort by date/name work correctly
- [ ] Delete operates in context of current tab (Local vs Cloud)

---

## 2. User Stories & Acceptance Criteria

### Story 1: Grid/List View Toggle

**As a** user,
**I want** to switch between grid (card) and list (table) views in my Library,
**so that** I can browse records visually or scan densely.

#### Acceptance Criteria

- **Given** I am on the Library page,
  **When** I click the grid icon in the toolbar,
  **Then** records display as cards in a responsive grid (2-3 columns depending on screen width).

- **Given** I am on the Library page,
  **When** I click the list icon in the toolbar,
  **Then** records display as rows with columns: text snippet, voice, duration, date, status, actions.

- **Given** I switch between views,
  **When** I toggle,
  **Then** the current tab/filter/search state is preserved.

### Story 2: Cloud Sync for Pro Users

**As a** pro user,
**I want** my audio records to automatically sync to cloud storage,
**so that** I can access them from any device and have a backup.

#### Acceptance Criteria

- **Given** I am a pro user with existing local records,
  **When** I open the Library page,
  **Then** the sync engine detects local-only records and uploads them to cloud.

- **Given** sync is in progress,
  **When** records are being uploaded,
  **Then** a progress bar shows current/total count.

- **Given** sync completes,
  **When** all local records are uploaded,
  **Then** their status badge changes from "Local" to "Synced".

- **Given** I am a free user,
  **When** I open the Library page,
  **Then** no sync occurs and the Cloud tab shows a "Pro feature" badge.

### Story 3: Status Badges

**As a** user,
**I want** to see the storage status of each record (Local / Cloud / Synced),
**so that** I know where my data lives.

#### Acceptance Criteria

- **Given** a record exists only in IndexedDB,
  **When** displayed in any view,
  **Then** it shows a green "Local" badge.

- **Given** a record exists only on cloud,
  **When** displayed,
  **Then** it shows an orange "Cloud" badge.

- **Given** a record exists in both IndexedDB and cloud,
  **When** displayed,
  **Then** it shows a blue "Synced" badge.

### Story 4: Filter & Sort

**As a** user,
**I want** to filter by voice and sort by date or name,
**so that** I can find records quickly.

#### Acceptance Criteria

- **Given** I am on the Library page,
  **When** I select a voice from the filter dropdown,
  **Then** only records with that voice_id are shown.

- **Given** I select a sort option (Newest / Oldest / A-Z),
  **When** the sort is applied,
  **Then** records reorder accordingly.

- **Given** I switch tabs (All/Local/Cloud/Synced),
  **When** the tab changes,
  **Then** filter and sort settings persist.

### Story 5: Context-Sensitive Delete

**As a** user,
**I want** to delete a record from its current storage context,
**so that** I control exactly where data is removed.

#### Acceptance Criteria

- **Given** I am in the Local tab,
  **When** I delete a record,
  **Then** it is removed from IndexedDB only.

- **Given** I am in the Cloud tab,
  **When** I delete a record,
  **Then** it is removed from the cloud (R2 + DB) only.

- **Given** I am in the All or Synced tab,
  **When** I delete a record,
  **Then** it is removed from both IndexedDB and cloud.

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Library page supports grid and list view modes, toggleable via toolbar icon | Must |
| FR-2 | Grid view shows cards with: gradient thumbnail, voice name, text snippet, duration, date, status badge, play + menu actions | Must |
| FR-3 | List view shows rows with: colored icon, text, voice, duration, date, status badge, play + menu actions | Must |
| FR-4 | Four tabs: All / Local / Cloud / Synced, with record counts per tab | Must |
| FR-5 | Free users see Cloud tab disabled with "Pro feature" badge and upgrade prompt | Must |
| FR-6 | Voice filter dropdown populated from existing records' voice_ids | Must |
| FR-7 | Sort options: Newest first, Oldest first, A-Z by text_content | Must |
| FR-8 | Search input filters by text_content substring match | Should |
| FR-9 | Pro users see auto-sync on page load: local records uploaded to cloud | Must |
| FR-10 | Sync progress bar shows during upload (current/total, percentage) | Must |
| FR-11 | Status badge reflects record state: Local (green), Cloud (orange), Synced (blue) | Must |
| FR-12 | Delete respects current tab context (Local = remove from IndexedDB only, Cloud = remove from cloud only, All/Synced = remove from both) | Must |
| FR-13 | Duration field stored and displayed (currently missing from data model) | Must |
| FR-14 | "Upload to Cloud" action available on local-only records for pro users | Must |
| FR-15 | Old local records synced to cloud on first pro page load | Must |
| FR-16 | POST /api/library/sync endpoint for batch upsert of multiple records | Must |
| FR-17 | Backend audio_records table gets duration FLOAT column | Must |

### 3.2 Edge Cases

- User upgrades to pro while Library is open: detect tier change and trigger initial sync
- Network fails during sync: show error toast with retry button, preserve local data
- Quota exceeded during sync: show warning with upgrade prompt, mark as "Local (quota exceeded)"
- User downgrades from pro to free: cloud records remain readable but new sync stops
- Empty library: show empty state with illustration and CTA to go to Studio
- Very long text content: truncated in grid card (2 lines), full in list view
- Duplicate records: sync is idempotent (match by source_id/client_id)

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Network error during sync | Toast: "Sync failed. Retry?" + retry button. Local data unchanged |
| Cloud upload quota exceeded | Per-record warning badge. Batch shows partial success |
| Backend returns 401/403 during sync | Stop sync, show auth error toast |
| IndexedDB read/write fails | Error toast, fallback to cloud-only mode |
| R2 upload timeout | Retry individual record, skip after 3 failures, report in sync result |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Grid view renders 50 cards without lag (virtualization not needed for typical library sizes)
- Sync runs in background, does not block UI interaction
- Filter/sort operates on already-loaded data (client-side), no additional API calls
- Search debounced at 300ms

### 4.2 Security

- All cloud API endpoints require authentication (Bearer token)
- Record ownership verified server-side before delete/sync
- File upload size validated server-side (max 10MB per file)
- Batch sync validates each record individually

### 4.3 Constraints

- Platform: Next.js 16 (App Router), FastAPI backend
- Dependencies: Existing shadcn/ui components, React Query, IndexedDB
- Must work with existing auth system (JWT + refresh tokens)
- Must respect existing QuotaService for storage limits
- Must work with existing R2LibraryService for cloud operations

---

## 5. Implementation Plan

### 5.1 Frontend Components

```
frontend/src/features/library/
  api/
    library-api.ts              # React Query hooks: useCloudRecords, useSyncRecords, useDeleteRecord
  hooks/
    useLibraryRecords.ts        # Unified data source (IndexedDB + cloud, combined by sync_status)
    useLibrarySync.ts           # Sync orchestration: diff local vs cloud, upload missing, update status
    useLibraryFilter.ts         # Filter/sort/search state management
  components/
    LibraryPage.tsx             # Main page layout, orchestrates sub-components
    LibraryToolbar.tsx          # Search input, voice filter dropdown, sort selector, view toggle
    LibraryTabs.tsx             # All / Local / Cloud / Synced tabs with counts
    LibraryGrid.tsx             # CSS Grid of LibraryCard components
    LibraryList.tsx             # Table/list of LibraryCardRow components
    LibraryCard.tsx             # Single card (grid mode) with all metadata + actions
    LibraryCardRow.tsx          # Single row (list mode) with all metadata + actions
    LibraryEmpty.tsx            # Empty state with illustration
    LibrarySyncBar.tsx          # Sync progress bar (pro users)
    CloudUpgradeBanner.tsx      # Upgrade prompt (free users)
  types.ts                      # LibraryRecord, SyncStatus, FilterState interfaces
  index.ts                      # Public exports
```

### 5.2 Backend Changes

```
backend/app/
  api/library.py                # Add POST /sync endpoint
  services/library_service.py   # Add batch_sync() method
  models/audio_record.py        # Add duration FLOAT column
  schemas/library.py            # Add SyncRequest, SyncResponse schemas
```

### 5.3 Data Model

```typescript
interface SyncStatus {
  local: boolean;
  cloud: boolean;
}

interface LibraryRecord {
  id: string;
  text_content: string;
  voice_id: string;
  audio_url: string;        // local: base64 data URL; cloud: R2 public URL
  file_size_bytes: number;
  duration: number | null;  // NEW: stored from TTS response
  created_at: string;
  sync_status: SyncStatus;
}
```

### 5.4 Sync Algorithm

```
1. On Library page load (pro user only):
   a. Fetch cloud records from GET /api/library
   b. Read all local records from IndexedDB
   c. Compute diff: records in local but NOT in cloud (match by id)
   d. If diff.length > 0:
      - POST /api/library/sync with diff records (audio as base64)
      - On success: update local records' sync_status.cloud = true
      - Refresh cloud records via React Query invalidation
   e. Show progress bar during sync

2. On new TTS generation (pro user):
   a. Save to IndexedDB (existing behavior)
   b. Queue cloud upload via same sync mechanism
   c. No need to wait for upload to complete

3. Manual actions:
   - "Upload to Cloud" on single local-only record
   - "Sync All" button for forced re-sync
```

### 5.5 Backend API Contract

```
POST /api/library/sync
  Auth: Bearer Token (pro only)
  Body: {
    records: [{
      id: string,
      text_content: string,
      voice_id: string,
      audio_data: string,   // base64-encoded WAV
      file_size_bytes: number,
      duration: number | null
    }]
  }
  Response: {
    synced: [{ id, file_url, synced_at }],
    failed: [{ id, error }]
  }

POST /api/library/upload (modified)
  Now accepts and stores duration field

GET /api/library (modified)
  Now returns duration field in response
```

---

## 6. Boundaries

### [ALLOW] Always Do

- Use existing shadcn/ui components (Button, Badge, Input, Tabs, Select)
- Follow existing feature module pattern in `frontend/src/features/`
- Use React Query for all cloud API calls
- Use existing IndexedDB helpers for local storage

### [CAUTION] Ask First

- Adding new npm dependencies
- Modifying the database schema (adding duration column)
- Changing the R2 upload flow
- Modifying StudioLibraryDrawer (depends on useLocalLibrary)

### [FORBID] Never Do

- Store secrets or API keys client-side
- Remove existing IndexedDB records without user action
- Breaking changes to StudioLibraryDrawer interface
- Upload files to cloud without user consent / tier check

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | Status |
|-------------|-------------|--------|
| FR-1 (View toggle) | Manual + component test | Pending |
| FR-2 (Grid card) | Component test | Pending |
| FR-3 (List row) | Component test | Pending |
| FR-4 (Tabs) | Component test | Pending |
| FR-5 (Free user cloud tab) | Component test | Pending |
| FR-6 (Voice filter) | Unit test (filter logic) | Pending |
| FR-7 (Sort) | Unit test (sort logic) | Pending |
| FR-9 (Auto-sync pro) | Integration test | Pending |
| FR-11 (Status badge) | Component test | Pending |
| FR-12 (Context delete) | Integration test | Pending |
| FR-16 (Batch sync API) | Backend API test | Pending |

### 7.2 Acceptance Checklist

- [ ] All user stories implemented
- [ ] All acceptance criteria met
- [ ] Grid/list toggle works smoothly
- [ ] Pro auto-sync completes without errors
- [ ] Status badges update correctly after sync
- [ ] Delete respects tab context
- [ ] Free users see upgrade path
- [ ] Filter/sort work correctly
- [ ] Duration displayed correctly
- [ ] Edge cases handled (network error, quota exceeded, empty state)

---

## 8. Out of Scope

- Real-time sync via WebSocket
- Two-way merge conflict resolution
- Automatic retry with exponential backoff
- Public sharing links for audio files
- Voice cloning integration
- Bulk select / multi-delete
- Playlist or folder organization

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec | — | All |

