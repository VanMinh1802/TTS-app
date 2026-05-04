# Frontend Code Quality Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task.

**Goal:** Decompose 6 large files, move misplaced components, add React.memo + next/dynamic, extract duplicate styles, fix naming.

**Architecture:** Structural refactor — no logic changes. Each file split follows: extract sub-component to a new co-located file, keep state in parent, pass via props. Component move preserves import paths via barrel.

**Tech Stack:** Next.js 16, TypeScript 5, Tailwind CSS 4, framer-motion

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-04

---

## Task 1: Split `api-keys/page.tsx` (410 → ~150 lines)

**Files to create:**
- `src/app/api-keys/ApiKeyStats.tsx`
- `src/app/api-keys/CreateKeyModal.tsx`
- `src/app/api-keys/RevokeConfirmModal.tsx`
- `src/app/api-keys/NewKeyResultModal.tsx`

**Extract:**
1. **ApiKeyStats** — Lines 61-73 (`stats` useMemo) + lines 155-175 (stats UI grid). Props: `{ stats }`
2. **CreateKeyModal** — Lines 271-333. Props: `{ show, onClose, createForm, setCreateForm, onGenerate, isGenerating }`
3. **RevokeConfirmModal** — Lines 336-378. Props: `{ show, onClose, onRevoke }`
4. **NewKeyResultModal** — Lines 381-423. Props: `{ keyData, onClose, onCopy }`

**Page keeps:** state, `useEffect`, handlers, main layout

---

## Task 2: Split `studio/page.tsx` (403 → ~280 lines)

**Files to create:**
- `src/components/studio/StudioHero.tsx`
- `src/components/studio/PreviewPanel.tsx`

**Extract:**
1. **StudioHero** — Lines 355-389. Move to `components/studio/StudioHero.tsx`. Uses `useT()`.
2. **PreviewPanel** — Lines 391-431. Move to `components/studio/PreviewPanel.tsx`. Props: `{ audioUrl, onCopy, onDownload, loading, normMeta }`.

**Barrel:** Update `components/studio/index.ts` to also export `StudioHero`, `PreviewPanel`.

---

## Task 3: Split `CustomDictionary.tsx` (388 → ~260 lines)

**Files to create:**
- `src/components/studio/DictionaryEntryRow.tsx`
- `src/components/studio/DictionaryField.tsx`

**Extract:**
1. **DictionaryField** — Lines 381-387 (the `Field` component). Simple presentational.
2. **DictionaryEntryRow** — Lines 274-362 (edit mode + view mode for one entry). Props: `{ entry, index, isNewest, editingIndex, editForm, setEditForm, onStartEdit, onCancelEdit, onSaveEdit, onRemove, hasEdit }`.

---

## Task 4: Split `Navbar.tsx` (330 → ~180 lines)

**Files to create:**
- `src/components/layout/useAuth.ts`
- `src/components/layout/DesktopNav.tsx`
- `src/components/layout/UserMenu.tsx`

**Extract:**
1. **useAuth.ts** — Lines 19-58. Custom hook, returns `{ token, user }`.
2. **DesktopNav** — Lines 143-161 (nav links section). Props: `{ isLoggedIn, pathname }`.
3. **UserMenu** — Lines 183-253 (user dropdown + login button). Props: `{ isLoggedIn, user, onLogout }`.

---

## Task 5: Split `admin/page.tsx` (291 → ~180 lines)

**Files to create:**
- `src/app/admin/LicenseGenerator.tsx`
- `src/app/admin/LicenseTable.tsx`

**Extract:**
1. **LicenseGenerator** — Lines 117-222 (sidebar form + results). Props: `{ genCount, setGenCount, genTier, setGenTier, genDays, setGenDays, generating, onGenerate, newKeys, onCopyAll }`.
2. **LicenseTable** — Lines 238-301 (license list + empty state). Props: `{ licenses, onDelete }`.

---

## Task 6: Split `dashboard/page.tsx` (276 → ~130 lines)

**Files to create:**
- `src/app/dashboard/StatsGrid.tsx`
- `src/app/dashboard/QuotaSection.tsx`
- `src/app/dashboard/UsageHistory.tsx`

**Extract:**
1. **StatsGrid** — Lines 107-124. Props: `{ stats, loading }`.
2. **QuotaSection** — Lines 127-232 (quota bars + upgrade CTA). Props: `{ quota, loading, formatDate }`.
3. **UsageHistory** — Lines 235-269. Props: `{ history, formatDate }`.

---

## Task 7: Move `components/studio/` to `features/studio/components/`

**Move these files:**
```
components/studio/VoiceSelector.tsx       → features/studio/components/VoiceSelector.tsx
components/studio/VoiceSettings.tsx       → features/studio/components/VoiceSettings.tsx
components/studio/TextInput.tsx           → features/studio/components/TextInput.tsx
components/studio/CustomDictionary.tsx    → features/studio/components/CustomDictionary.tsx
components/studio/AudioPreview.tsx        → features/studio/components/AudioPreview.tsx
components/studio/CopilotDictionaryModal.tsx → features/studio/components/CopilotDictionaryModal.tsx
components/studio/StudioLibraryDrawer.tsx → features/studio/components/StudioLibraryDrawer.tsx
components/studio/StudioHero.tsx          → features/studio/components/StudioHero.tsx
components/studio/PreviewPanel.tsx        → features/studio/components/PreviewPanel.tsx
components/studio/DictionaryEntryRow.tsx  → features/studio/components/DictionaryEntryRow.tsx
components/studio/DictionaryField.tsx     → features/studio/components/DictionaryField.tsx
components/studio/index.ts                → features/studio/components/index.ts
```

**Create barrel files:**
`features/studio/index.ts`:
```typescript
export { VoiceSelector, VoiceSettings, TextInput, CustomDictionary, AudioPreview, CopilotDictionaryModal, StudioLibraryDrawer, StudioHero, PreviewPanel } from './components';
export { type DictionaryEntry } from './components/CustomDictionary';
```

**Update ALL imports:** Anywhere that imports from `@/components/studio` → change to `@/features/studio`. Check all 15+ import sites.

---

## Task 8: Add `React.memo` to 4 components

Wrap with `React.memo()`:
1. `StudioHero` — in `features/studio/components/StudioHero.tsx`
2. `PreviewPanel` — in `features/studio/components/PreviewPanel.tsx`
3. `DictionaryField` — in `features/studio/components/DictionaryField.tsx`
4. `AudioWaveform` — in `features/library/components/LibraryCard.tsx` (inner component)

---

## Task 9: Lazy-load `WebGLBackground` with `next/dynamic`

**File:** `src/app/page.tsx`

Change:
```typescript
// Before:
import { WebGLBackground } from "@/components/ui/WebGLBackground";

// After:
import dynamic from "next/dynamic";
const WebGLBackground = dynamic(() => import("@/components/ui/WebGLBackground").then(m => m.WebGLBackground), { ssr: false });
```

---

## Task 10: Extract radial gradient to CSS class

**File:** `src/app/globals.css`

Add:
```css
.aether-bg-gradient {
  background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%);
}
```

**Update 7 pages** to use the class instead of inline `style`:
Replace:
```tsx
<div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }}></div>
```
With:
```tsx
<div className="absolute inset-0 pointer-events-none aether-bg-gradient"></div>
```

Pages: `api-keys/page.tsx`, `voices/page.tsx`, `admin/page.tsx`, `dictionary/page.tsx`, `settings/page.tsx`, `pricing/page.tsx`, `library/page.tsx`

---

## Task 11: Rename `indexedDB.ts` → `indexed-db.ts`

**Rename file:** `features/library/lib/indexedDB.ts` → `features/library/lib/indexed-db.ts`

**Update imports in 6 files:**
```
features/library/hooks/useLibraryRecords.ts  — ../lib/indexedDB → ../lib/indexed-db
features/library/hooks/useLibrarySync.ts     — ../lib/indexedDB → ../lib/indexed-db
features/library/hooks/useLocalLibrary.ts    — ../lib/indexedDB → ../lib/indexed-db
```

---

## Task 12: Final verification

Run: `npm run build` + `npm test`
Expected: build passes, 17 tests pass.

---

## 3. Constraints

- No logic changes — pure structural refactor
- All existing behavior preserved
- Import paths updated correctly via barrel exports

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan | — | All |
