# Frontend Dead Code Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Remove 22 dead files (~1,300 lines), 10 unused exports, 1 dead page, 1 empty folder, and `fuse.js` dependency. Replace 11 `any` types with proper types.

**Architecture:** This is a pure cleanup — no new features, no logic changes. All deletions verified via grep to ensure no imports exist. File removals are safe mechanical operations. Type replacements use existing `LibraryRecord` type already defined in `features/library/types.ts`.

**Tech Stack:** Next.js 16, TypeScript 5, Tailwind CSS 4

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Architecture Overview

### 1.1 System Context

This plan removes code in the frontend that is never imported or executed. Zero impact on runtime behavior. The following module trees are affected:

- `src/lib/` — 11 dead utility/service modules
- `src/components/ui/` — 2 dead UI components
- `src/components/studio/` — 2 dead studio components + 1 dead barrel export
- `src/features/*/api/` — 4 dead API modules
- `src/app/test-client/` — dead debug page
- `src/components/dashboard/` — empty folder

### 1.2 Preservation Rules

| Rule | Detail |
|------|--------|
| Keep `lib/tts/emotion-parser.ts` | Used by `EmotionEditor.tsx` via `@/lib/tts/emotion-parser` |
| Keep `lib/api-client.ts` | Core API client used by all feature API modules |
| Keep `lib/tts/index.ts` deletion safe | No consumer imports from the barrel; all use direct paths |
| Keep `shared/i18n.tsx` | Remove only `useLocale` export; keep `I18nProvider`, `useT` |

---

## 2. Tasks

### Task 1: Remove dead `lib/` modules (13 files + 1 package)

**Description:** Delete all unused `lib/` modules and remove `fuse.js` from `package.json`. All verified as zero imports via grep.

**Files to delete:**
- `src/lib/utils.ts`
- `src/lib/auth/index.ts`
- `src/lib/storage/index.ts`
- `src/lib/core/index.ts`
- `src/lib/sync/index.ts`
- `src/lib/offline/index.ts`
- `src/lib/cache/index.ts`
- `src/lib/cache/model-cache.ts`
- `src/lib/cache/indexeddb.ts`
- `src/lib/cache/lru-eviction.ts`
- `src/lib/tts/index.ts`
- `src/lib/tts/emotion-dict.ts`
- `src/lib/tts/worker-client.ts`

**File to modify:**
- `frontend/package.json` — remove `"fuse.js": "^7.3.0"` from dependencies

---

**[STEP 1.1]** Delete the 13 files:

```powershell
Remove-Item "frontend/src/lib/utils.ts"
Remove-Item -Recurse "frontend/src/lib/auth"
Remove-Item -Recurse "frontend/src/lib/storage"
Remove-Item -Recurse "frontend/src/lib/core"
Remove-Item -Recurse "frontend/src/lib/sync"
Remove-Item -Recurse "frontend/src/lib/offline"
Remove-Item -Recurse "frontend/src/lib/cache"
Remove-Item "frontend/src/lib/tts/index.ts"
Remove-Item "frontend/src/lib/tts/emotion-dict.ts"
Remove-Item "frontend/src/lib/tts/worker-client.ts"
```

**[STEP 1.2]** Remove `fuse.js` from `frontend/package.json`:

Edit `frontend/package.json`, remove the line:
```
"fuse.js": "^7.3.0",
```

**[STEP 1.3]** Run `npm install` in `frontend/` to update lockfile:

```bash
npm install
```

**Verify:** `npm run build` passes with no import errors.

---

### Task 2: Remove dead UI + studio components (4 files)

**Description:** Delete `TopoDriftBackground.tsx`, `icons.tsx`, `EmotionEditor.tsx`, `ExportPanel.tsx`. All zero imports verified.

**Files to delete:**
- `src/components/ui/TopoDriftBackground.tsx`
- `src/components/ui/icons.tsx`
- `src/components/studio/EmotionEditor.tsx`
- `src/components/studio/ExportPanel.tsx`

**File to modify:**
- `src/components/studio/index.ts` — remove line 6: `export { ExportPanel } from './ExportPanel';`

---

**[STEP 2.1]** Delete the 4 component files:

```powershell
Remove-Item "frontend/src/components/ui/TopoDriftBackground.tsx"
Remove-Item "frontend/src/components/ui/icons.tsx"
Remove-Item "frontend/src/components/studio/EmotionEditor.tsx"
Remove-Item "frontend/src/components/studio/ExportPanel.tsx"
```

**[STEP 2.2]** Edit `src/components/studio/index.ts` — remove the ExportPanel re-export:

Remove the line:
```typescript
export { ExportPanel } from './ExportPanel';
```

**Verify:** `npm run build` passes.

---

### Task 3: Remove dead feature API modules (4 files)

**Description:** Delete 4 feature API modules that are never imported. Pages use `apiRequest()` directly.

**Files to delete:**
- `src/features/subscription/api/subscription-api.ts`
- `src/features/admin/api/admin-api.ts`
- `src/features/dashboard/api/dashboard-api.ts`
- `src/features/dictionary/types/dictionary-types.ts`

---

```powershell
Remove-Item "frontend/src/features/subscription/api/subscription-api.ts"
Remove-Item "frontend/src/features/admin/api/admin-api.ts"
Remove-Item "frontend/src/features/dashboard/api/dashboard-api.ts"
Remove-Item "frontend/src/features/dictionary/types/dictionary-types.ts"
```

**Verify:** `npm run build` passes.

---

### Task 4: Remove dead test-client page + empty dashboard folder

**Description:** Delete the debug test-client page and the empty `components/dashboard/` folder.

**Files to delete:**
- `src/app/test-client/page.tsx`
- `src/app/test-client/` directory
- `src/components/dashboard/` directory (empty)

---

```powershell
Remove-Item -Recurse "frontend/src/app/test-client"
Remove-Item -Recurse "frontend/src/components/dashboard"
```

**Verify:** `npm run build` passes.

---

### Task 5: Remove 10 unused exports from 4 files

**Description:** Strip unused exports from files that are otherwise in use.

**File: `src/features/voice/api/voice-api.ts`**
Remove: `getVoiceLibrary` (lines 37-61), `validateGeminiKey` (lines 85-90), `ValidateKeyResult` type (line 15)

```typescript
// REMOVE lines 15: export type ValidateKeyResult = ...
// REMOVE lines 35-61: entire getVoiceLibrary function (including voiceLibraryCache variable at line 35)
// REMOVE lines 85-90: entire validateGeminiKey function
```

**File: `src/features/library/api/library-api.ts`**
Remove: `uploadToCloud` (lines 47-65)

```typescript
// REMOVE lines 47-65: entire uploadToCloud function
```

**File: `src/components/motion/index.tsx`**
Remove: `ScaleIn` (approx line 72), `SlideIn` (approx line 99), `MagneticHover` (approx line 131), `AnimatedPresence` (approx line 169), `PageTransition` (approx line 193), `Shimmer` (approx line 208)

Each removal = delete the interface block + the `export function` block.

**File: `src/shared/i18n.tsx`**
Remove: `useLocale` (lines 21-23)

```typescript
// REMOVE lines 21-23:
export function useLocale() {
  return useContext(I18nContext).locale;
}
```

---

**Verify:** `npm run build` passes (no import errors for removed exports).

---

### Task 6: Replace 11 `any` types with proper types

**Description:** Replace all `any` type usages with proper TypeScript types.

---

#### 6.1 `src/features/library/lib/indexedDB.ts` (2 instances)

Line 18: `Promise<any[]>` → `Promise<LibraryRecord[]>`
Line 29: `record: any` → `record: LibraryRecord`

Add import at top:
```typescript
import { LibraryRecord } from '../types';
```

Change:
```typescript
// BEFORE (line 18):
export async function getRecordsFromDB(): Promise<any[]> {

// AFTER:
export async function getRecordsFromDB(): Promise<LibraryRecord[]> {

// BEFORE (line 29):
export async function saveRecordToDB(record: any): Promise<void> {

// AFTER:
export async function saveRecordToDB(record: LibraryRecord): Promise<void> {
```

#### 6.2 `src/features/library/hooks/useLibraryRecords.ts` (3 instances)

Line 24: `(r: any)` in `localMap` → `(r: LibraryRecord)`
Line 51: `(r: any)` in `localRecords.map` → `(r: LibraryRecord)`
Line 56: `catch (e: any)` → `catch (e: unknown)`

Changes:
```typescript
// BEFORE (line 24):
const localMap = new Map(localRecords.map((r: any) => [r.id, r]));

// AFTER:
const localMap = new Map(localRecords.map((r: LibraryRecord) => [r.id, r]));

// BEFORE (line 51):
setRecords(localRecords.map((r: any) => ({

// AFTER:
setRecords(localRecords.map((r: LibraryRecord) => ({

// BEFORE (line 56):
} catch (e: any) {

// AFTER:
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : 'Failed to load library records';
  setError(message);
```

#### 6.3 `src/features/library/hooks/useLibrarySync.ts` (1 instance)

Line 26: `(r: any)` → `(r: LibraryRecord)`

Change:
```typescript
// BEFORE (line 26):
const localRec = localRecords.find((r: any) => r.id === rec.id);

// AFTER:
const localRec = localRecords.find((r: LibraryRecord) => r.id === rec.id);
```

#### 6.4 `src/features/library/hooks/useLocalLibrary.ts` (3 instances)

Line 5: `useState<any[]>` → `useState<LibraryRecord[]>`
Line 22: `record: any` → `record: LibraryRecord`
Also add import for `LibraryRecord` from `../types`

Changes:
```typescript
// ADD import at top:
import { LibraryRecord } from '../types';

// BEFORE (line 5):
const [records, setRecords] = useState<any[]>([]);

// AFTER:
const [records, setRecords] = useState<LibraryRecord[]>([]);

// BEFORE (line 22):
const saveLocalRecord = useCallback(async (record: any) => {

// AFTER:
const saveLocalRecord = useCallback(async (record: LibraryRecord) => {
```

#### 6.5 `src/shared/i18n.tsx` (1 instance)

Line 38: `function useT(): any` → `function useT(): Messages`

Change:
```typescript
// BEFORE (line 38):
export function useT(): any {

// AFTER:
export function useT(): Messages {
```

---

**Verify:** `npm run build` passes with strict TypeScript. `npm test` passes for library tests.

---

### Task 7: Update `lib/api-client.ts` if it imports from deleted files

**Description:** Verify `lib/api-client.ts` has no imports from deleted files. It currently imports from `shared/notifications/notification-store` which is NOT deleted.

**Check:** `src/lib/api-client.ts` imports only:
- `{ notificationService }` from `@/shared/notifications/notification-store`

This import is safe. No changes needed.

---

### Task 8: Final verification

**Description:** Run build and tests to confirm all changes are safe.

```bash
npm run build
npm test
```

**Expected:** Both pass with zero errors.

---

## 3. Files Changed Summary

### Deleted (22 files + 2 directories)
| # | Path |
|---|------|
| 1 | `src/lib/utils.ts` |
| 2 | `src/lib/auth/index.ts` |
| 3 | `src/lib/storage/index.ts` |
| 4 | `src/lib/core/index.ts` |
| 5 | `src/lib/sync/index.ts` |
| 6 | `src/lib/offline/index.ts` |
| 7 | `src/lib/cache/index.ts` |
| 8 | `src/lib/cache/model-cache.ts` |
| 9 | `src/lib/cache/indexeddb.ts` |
| 10 | `src/lib/cache/lru-eviction.ts` |
| 11 | `src/lib/tts/index.ts` |
| 12 | `src/lib/tts/emotion-dict.ts` |
| 13 | `src/lib/tts/worker-client.ts` |
| 14 | `src/components/ui/TopoDriftBackground.tsx` |
| 15 | `src/components/ui/icons.tsx` |
| 16 | `src/components/studio/EmotionEditor.tsx` |
| 17 | `src/components/studio/ExportPanel.tsx` |
| 18 | `src/features/subscription/api/subscription-api.ts` |
| 19 | `src/features/admin/api/admin-api.ts` |
| 20 | `src/features/dashboard/api/dashboard-api.ts` |
| 21 | `src/features/dictionary/types/dictionary-types.ts` |
| 22 | `src/app/test-client/page.tsx` |
| Dir | `src/app/test-client/` |
| Dir | `src/components/dashboard/` |

### Modified (7 files)
| # | Path | Change |
|---|------|--------|
| 1 | `frontend/package.json` | Remove `fuse.js` |
| 2 | `src/components/studio/index.ts` | Remove ExportPanel re-export |
| 3 | `src/features/voice/api/voice-api.ts` | Remove `getVoiceLibrary`, `validateGeminiKey` |
| 4 | `src/features/library/api/library-api.ts` | Remove `uploadToCloud` |
| 5 | `src/components/motion/index.tsx` | Remove 6 unused exports |
| 6 | `src/shared/i18n.tsx` | Remove `useLocale`, tighten `useT` return type |
| 7 | `src/features/library/lib/indexedDB.ts` | Replace 2 `any` types |
| 8 | `src/features/library/hooks/useLibraryRecords.ts` | Replace 3 `any` types |
| 9 | `src/features/library/hooks/useLibrarySync.ts` | Replace 1 `any` type |
| 10 | `src/features/library/hooks/useLocalLibrary.ts` | Replace 2 `any` types |

---

## 4. Constraints & Trade-offs

### 4.1 Constraints
- No logic changes — all deletions verified via grep for zero imports
- Existing tests must pass with zero modifications
- `npm run build` must pass in strict TypeScript mode

### 4.2 Out of Scope
- Refactoring large files (Phase 2)
- Adding `React.memo`, `next/dynamic` (Phase 2)
- Extracting duplicate styles to CSS classes (Phase 2)
- Adding `loading.tsx`/`error.tsx` (Phase 3)
- Accessibility improvements (Phase 3)
- Adding React Query (Phase 3)

---

## 5. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan | — | All |
