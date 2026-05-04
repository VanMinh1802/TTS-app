# Frontend UX Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add loading/error boundaries, accessibility improvements, and performance optimizations.

**Architecture:** Next.js App Router conventions for loading.tsx/error.tsx. CSS-only a11y for skip link. Reactive performance via `document.hidden` and media queries.

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Draft

---

## Task 1: Add `loading.tsx` to 4 route segments

Create these files with a simple skeleton/spinner:

### `src/app/dashboard/loading.tsx`
### `src/app/library/loading.tsx`
### `src/app/studio/loading.tsx`
### `src/app/voices/loading.tsx`

Each file:
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-[#A1A1AA]">Đang tải...</p>
      </div>
    </div>
  );
}
```

---

## Task 2: Add `error.tsx` to 4 route segments

Create these files with a retry button:

### `src/app/studio/error.tsx`
### `src/app/library/error.tsx`
### `src/app/admin/error.tsx`
### `src/app/dashboard/error.tsx`

Each file (copy pattern from existing `src/app/error.tsx`):
```tsx
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full">
        <div className="aether-glass p-8 text-center">
          <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm text-[#A1A1AA] mb-6">{error.message || "Không thể tải trang này."}</p>
          <button onClick={reset} className="aether-btn aether-btn-primary px-6 py-2.5 text-[10px] font-medium uppercase tracking-widest">
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 3: Add skip-to-content link in `layout.tsx`

### `src/app/layout.tsx`

Add right after `<body>` tag, before `<ThemeProvider>`:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#6366F1] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
  Bỏ qua nội dung
</a>
```

Add `id="main-content"` to the `<main>` tag or the first `<div>` wrapper.

---

## Task 4: Add `htmlFor`/`id` to form labels in `CustomDictionary`

### `src/features/studio/components/CustomDictionary.tsx`

Read the file. Find all `<label>` elements for inputs and add proper `htmlFor`/`id` pairs. The `Field` component wraps in a `<label>` but the inputs don't have IDs.

Update `DictionaryField.tsx` to:
- Accept an optional `htmlFor` prop
- Or change the label approach to not wrap inputs in `<label>`

Simplest: make `Field` receive `htmlFor`:
```tsx
export const Field = React.memo(function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[9px] font-light uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</label>
      {children}
    </div>
  );
});
```

Then add `id` to each input in `CustomDictionary.tsx`:
- Word input: `id="dict-word"`
- Pronunciation input: `id="dict-pronunciation"`
- Drawer search input: `id="dict-search"`

Pass `htmlFor` accordingly.

---

## Task 5: Add `aria-hidden` to decorative SVGs

Search for SVG elements in layout/Navbar.tsx that are decorative (not interactive). Add `aria-hidden="true"`.

Focus areas:
- Logo SVG (if any decorative parts)
- Navbar divider SVGs
- Any `<svg>` inside `<button>` (these should keep their aria-label; decorative ones inside get aria-hidden)

Also check `components/motion/index.tsx` and page files for decorative SVGs.

---

## Task 6: Add `aria-live` region for TTS status

### `src/app/studio/page.tsx`

Wrap the audio preview area with `aria-live="polite"`:
```tsx
<div aria-live="polite">
  <PreviewPanel ... />
</div>
```

Also add to the error display area:
```tsx
<div aria-live="assertive" role="alert">
  {error && <...error message.../>}
</div>
```

---

## Task 7: Pause `WebGLBackground` on visibility change

### `src/components/ui/WebGLBackground.tsx`

Read the file. Find the `requestAnimationFrame` loop. Add a `useEffect` that listens for `document.visibilitychange` and pauses/resumes the animation loop.

Pattern:
```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      // pause/stop animation loop or reduce frame rate
    } else {
      // resume
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}, []);
```

---

## Task 8: Reduce backdrop-filter blur on mobile

### `src/app/globals.css`

Add media query:
```css
@media (max-width: 768px) {
  .aether-glass {
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }
}
```

---

## Task 9: Final verification

Run: `npm run build` + `npm test`
Expected: build passes, 17 tests pass.

---

## 3. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan | — | All |
