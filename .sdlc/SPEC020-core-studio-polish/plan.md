# Studio Polish — Plan

**Goal:** 3 focused UX improvements to Studio page.

**Files:**
- `frontend/src/app/studio/page.tsx` — reorder toolbar + action bar
- `frontend/src/features/studio/components/PreviewPanel.tsx` — add waveform + progress

**No new components.** All changes inline.

---

### Task 1: Toolbar Group + Action Bar + Waveform

Read the current `frontend/src/app/studio/page.tsx` and `frontend/src/features/studio/components/PreviewPanel.tsx`, then apply:

**A. Toolbar:** Wrap the 3 tool buttons (Sửa chính tả, Kiểm tra, Chia đoạn) in a compact glass wrapper band with proper svg icons instead of emoji.

**B. Floating Action Bar:** Move the Generate/Cancel/Library buttons to a sticky bottom bar that's more prominent. Use glass pill container with shadow.

**C. Waveform:** In PreviewPanel, add `AudioWaveform` animation (reuse pattern from LibraryCard) when `loading` is true, driven by `progress` prop.

Implement all 3 changes, then verify:
```bash
cd frontend
npx next build 2>&1 | tail -5
```
