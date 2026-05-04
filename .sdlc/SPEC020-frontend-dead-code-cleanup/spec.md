# Feature: Frontend Dead Code Cleanup

> **Status:** Approved
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Problem Statement

### 1.1 User Problem

Code review identified 22 completely dead files (~1,300 lines), 10 unused exports, 11 `any` type violations, and an empty folder in the frontend codebase. These add noise, increase bundle analysis time, and create maintenance debt.

### 1.2 Business Impact

- Dead code slows down build times and increases CI minutes
- `any` types defeat TypeScript strict mode, hiding real bugs
- Unused dependencies (`fuse.js`) bloat `node_modules` and bundle size

### 1.3 Success Criteria

- [ ] 22 dead files removed from `frontend/src/`
- [ ] `fuse.js` removed from `package.json` dependencies
- [ ] 10 unused exports removed from 4 files
- [ ] 4 unused feature API modules removed
- [ ] `app/test-client/` page removed
- [ ] Empty `components/dashboard/` folder deleted
- [ ] 11 `any` types replaced with proper types
- [ ] `npm run build` passes with no errors
- [ ] Existing tests pass

---

## 2. Functional Requirements

### 2.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Remove all dead files that export symbols never imported | Must |
| FR-2 | Remove `fuse.js` from `package.json` (only imported by dead file) | Must |
| FR-3 | Remove 10 unused exports from files that are still in use | Must |
| FR-4 | Remove 4 feature API modules that pages use `apiRequest` directly instead | Must |
| FR-5 | Remove `app/test-client/page.tsx` debug page | Must |
| FR-6 | Delete empty `components/dashboard/` folder | Must |
| FR-7 | Replace 11 `any` types with proper TypeScript types | Must |
| FR-8 | Ensure `npm run build` and existing tests pass after all changes | Must |

### 2.2 Edge Cases

- Files being deleted must not be imported anywhere (verified via grep)
- Deleting a barrel export file requires also removing its re-exports if consumers use the barrel path
- `lib/tts/emotion-parser.ts` must be kept (used by EmotionEditor); only `emotion-dict.ts` and `worker-client.ts` get deleted
- `lib/tts/index.ts` barrel gets deleted, so `emotion-parser.ts` import path must remain direct `@/lib/tts/emotion-parser`

---

## 3. Dead Files Inventory

### 3.1 lib/ modules (11 files)

| File | Reason |
|------|--------|
| `src/lib/utils.ts` | `cn()` never imported |
| `src/lib/auth/index.ts` | Token helpers unused; app uses localStorage directly |
| `src/lib/storage/index.ts` | localStorage wrapper unused |
| `src/lib/core/index.ts` | `debounce`, `throttle`, etc. all unused |
| `src/lib/sync/index.ts` | Sync status manager unused |
| `src/lib/offline/index.ts` | Offline queue unused |
| `src/lib/cache/index.ts` | Barrel re-export unused |
| `src/lib/cache/model-cache.ts` | IndexedDB model cache unused |
| `src/lib/cache/indexeddb.ts` | IndexedDB wrapper unused |
| `src/lib/cache/lru-eviction.ts` | LRU eviction unused |
| `src/lib/tts/index.ts` | Barrel; only `emotion-parser.ts` is used |
| `src/lib/tts/emotion-dict.ts` | `createEmotionDictService` never called |
| `src/lib/tts/worker-client.ts` | `TTSWorkerClient` never instantiated |

### 3.2 Unused components (4 files)

| File | Reason |
|------|--------|
| `src/components/ui/TopoDriftBackground.tsx` | Never imported |
| `src/components/ui/icons.tsx` | `IconVoice`, `IconSparkles` unused |
| `src/components/studio/EmotionEditor.tsx` | Not in barrel, never imported |
| `src/components/studio/ExportPanel.tsx` | Exported but never imported |

### 3.3 Unused feature API modules (4 files)

| File | Reason |
|------|--------|
| `src/features/subscription/api/subscription-api.ts` | Pages use `apiRequest` directly |
| `src/features/admin/api/admin-api.ts` | Pages use `apiRequest` directly |
| `src/features/dashboard/api/dashboard-api.ts` | Pages use `apiRequest` directly |
| `src/features/dictionary/types/dictionary-types.ts` | Consumers use definition from `dictionary-api.ts` |

### 3.4 Dead page (1 file)

| File | Reason |
|------|--------|
| `src/app/test-client/page.tsx` | Debug page, no navigation links |

### 3.5 Empty folder

| Path |
|------|
| `src/components/dashboard/` |

### 3.6 Unused exports in used files (10 exports)

| File | Unused Export |
|------|---------------|
| `src/features/voice/api/voice-api.ts` | `getVoiceLibrary`, `validateGeminiKey` |
| `src/features/library/api/library-api.ts` | `uploadToCloud` |
| `src/components/motion/index.tsx` | `ScaleIn`, `SlideIn`, `MagneticHover`, `AnimatedPresence`, `PageTransition`, `Shimmer` |
| `src/shared/i18n.tsx` | `useLocale` |

### 3.7 `any` type violations (11 instances)

| File | Count | Fix |
|------|-------|-----|
| `src/features/library/hooks/useLibraryRecords.ts` | 3 | Use `LibraryRecord` type |
| `src/features/library/hooks/useLibrarySync.ts` | 1 | Use `LibraryRecord` type |
| `src/features/library/hooks/useLocalLibrary.ts` | 1 | Use `LibraryRecord` type |
| `src/features/library/lib/indexedDB.ts` | 2 | Use generic `<T>` |
| `src/shared/i18n.tsx` | 1 | Use proper return type from `next-intl` |

---

## 4. Out of Scope

- Refactoring large files (Phase 2)
- Adding `React.memo` or `next/dynamic` (Phase 2)
- Adding `loading.tsx`/`error.tsx` (Phase 3)
- Accessibility improvements (Phase 3)
- Adding React Query (Phase 3)
- Moving `components/studio/` to `features/studio/` (Phase 2)

---

## 5. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec | — | All |
