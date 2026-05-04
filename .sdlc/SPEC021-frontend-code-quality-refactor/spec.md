# Feature: Frontend Code Quality Refactor

> **Status:** Approved
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Problem Statement

### 1.1 User Problem

Code review identified structural issues: 6 files over 250 lines, misplaced feature components in `components/studio/`, no `React.memo` usage, heavy components eagerly loaded, and duplicate inline styles across 7 pages.

### 1.2 Success Criteria

- [ ] 6 large files decomposed into focused sub-components
- [ ] `components/studio/` moved to `features/studio/components/` (7 files + barrel)
- [ ] `React.memo` applied to 4 expensive inner components
- [ ] `WebGLBackground` lazy-loaded with `next/dynamic`
- [ ] Radial gradient extracted to CSS class (7 pages updated)
- [ ] `indexedDB.ts` renamed to `indexed-db.ts` (kebab-case)
- [ ] `npm run build` passes, 17 tests pass

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Split `api-keys/page.tsx` (410 lines) — extract 3 modals + key row | Must |
| FR-2 | Split `studio/page.tsx` (403 lines) — extract `StudioHero`, `PreviewPanel` to files | Must |
| FR-3 | Split `CustomDictionary.tsx` (360 lines) — extract `DictionaryEntryRow`, `Field` | Must |
| FR-4 | Split `Navbar.tsx` (309 lines) — extract `DesktopNav`, `MobileNav`, `useAuth` | Must |
| FR-5 | Split `admin/page.tsx` (291 lines) — extract dropdown + results | Must |
| FR-6 | Split `dashboard/page.tsx` (261 lines) — extract stats + quota + history | Must |
| FR-7 | Move `components/studio/` to `features/studio/components/` + update all imports | Must |
| FR-8 | Add `React.memo` to `StudioHero`, `PreviewPanel`, `Field`, `AudioWaveform` | Must |
| FR-9 | Lazy-load `WebGLBackground` with `next/dynamic` on homepage | Must |
| FR-10 | Extract radial gradient to global CSS class, apply to 7 pages | Must |
| FR-11 | Rename `indexedDB.ts` to `indexed-db.ts` + update 6 imports | Must |
| FR-12 | `npm run build` passes, 17 tests pass | Must |

---

## 3. Out of Scope

- Phase 3 items (`loading.tsx`, `error.tsx`, accessibility, React Query)
- Moving other components outside `studio/`

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec | — | All |
