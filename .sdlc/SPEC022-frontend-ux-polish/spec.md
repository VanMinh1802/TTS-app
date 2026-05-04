# Feature: Frontend UX Polish (Accessibility + Performance)

> **Status:** Approved
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Problem Statement

Review identified accessibility gaps (no skip link, missing label/input pairing, no focus trapping, no aria-live regions) and performance issues (canvas doesn't pause on tab switch, expensive backdrop-filter on mobile).

### 1.1 Success Criteria

- [ ] `loading.tsx` added for 4 key routes
- [ ] `error.tsx` added for 4 key routes
- [ ] Skip-to-content link in layout
- [ ] `htmlFor`/`id` pairing on form labels in CustomDictionary
- [ ] `aria-hidden="true"` on decorative SVGs
- [ ] `aria-live` region for audio generation status
- [ ] Canvas pauses on `document.hidden`
- [ ] Backdrop-filter reduced on mobile
- [ ] `npm run build` passes, 17 tests pass

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Add `loading.tsx` to `/dashboard`, `/library`, `/studio`, `/voices` route segments | Must |
| FR-2 | Add `error.tsx` to `/studio`, `/library`, `/admin`, `/dashboard` route segments | Must |
| FR-3 | Add skip-to-content link to `layout.tsx` | Must |
| FR-4 | Add `htmlFor`/`id` to form labels in CustomDictionary | Should |
| FR-5 | Add `aria-hidden` to decorative SVG elements | Should |
| FR-6 | Add `aria-live` region for TTS generation status | Should |
| FR-7 | Pause WebGLBackground canvas on `document.hidden` | Should |
| FR-8 | Reduce `backdrop-filter: blur()` on mobile via media query | Should |
| FR-9 | `npm run build` + tests pass | Must |

---

## 3. Out of Scope

- Adding React Query
- Full accessibility audit (WCAG AA)
- Focus trapping implementation (complex, needs separate spec)

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec | — | All |
