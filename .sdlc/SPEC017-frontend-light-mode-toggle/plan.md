# Light Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark/light mode toggle to the Navbar with CSS-driven theme switching across all pages.

**Architecture:** CSS class-based theming — a `.light` class on `<html>` triggers CSS overrides in `globals.css`. A `ThemeProvider` client component manages the state, persists preference to localStorage, and applies the class. The Navbar gets a sun/moon toggle button. No new dependencies.

**Tech Stack:** Next.js 16+ (App Router), Tailwind CSS v4, CSS custom properties, Framer Motion

---

> **Spec:** `.sdlc/SPEC017-frontend-light-mode-toggle/spec.md`
> **Status:** Draft
> **Author:** Roo
> **Date:** 2026-05-04

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `frontend/src/components/providers/ThemeProvider.tsx` | Client component: reads/writes localStorage, applies/removes `.light` class on `<html>`, handles first-visit default |

### Modified Files

| File | Changes |
|------|---------|
| `frontend/src/app/globals.css` | Add ~80 lines of `.light` CSS overrides for body, text, headlines, navbar, borders, inputs, scrollbar |
| `frontend/src/app/layout.tsx` | Wrap children with `<ThemeProvider>` |
| `frontend/src/components/layout/Navbar.tsx` | Add theme toggle button (sun/moon SVG icon) next to user menu |

---

## Tasks

### Task 1: Create ThemeProvider component

**Description:** A client component that manages theme state, persists to localStorage, and applies `.light` class to `<html>`.

**Files:** `frontend/src/components/providers/ThemeProvider.tsx`

---

**[GREEN]** Write the implementation directly (this is a simple provider with no business logic to test independently):

```tsx
// frontend/src/components/providers/ThemeProvider.tsx
"use client";

import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  return <>{children}</>;
}
```

---

### Task 2: Integrate ThemeProvider into layout

**Description:** Wrap the app with ThemeProvider so theme is applied on every page load.

**Files:** `frontend/src/app/layout.tsx`

---

**[GREEN]** Add ThemeProvider import and wrap children:

```tsx
// frontend/src/app/layout.tsx — add import at top
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// Wrap AppProviders with ThemeProvider (line 44)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          <AppProviders>
            <div className="min-h-screen w-full flex flex-col">
              <Navbar />
              <main className="flex-1 w-full pt-16">{children}</main>
            </div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

### Task 3: Add theme toggle button to Navbar

**Description:** Add a sun/moon icon button in the Navbar that toggles `.light` class on `<html>` and persists preference to localStorage.

**Files:** `frontend/src/components/layout/Navbar.tsx`

---

**[GREEN]** Add theme toggle state and button. Insert before the user menu section (around line 147, before the `{isLoggedIn ?` block):

First, add the state import and toggle logic inside the `Navbar` component function (after line 68 where `handleLogout` is defined):

```tsx
// Inside Navbar() function, after handleLogout (line 68)
const [isLight, setIsLight] = useState(false);

useEffect(() => {
  setIsLight(document.documentElement.classList.contains("light"));
}, []);
```

Add the toggle button JSX. Place it before the user menu section (around line 147, before `{isLoggedIn ?`):

```tsx
{/* Theme Toggle */}
<button
  onClick={() => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  }}
  className="w-9 h-9 flex items-center justify-center rounded-full text-[#A1A1AA] hover:text-[#818CF8] hover:bg-white/5 transition-all duration-200"
  aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
>
  {isLight ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )}
</button>
```

Also add the toggle button in the mobile menu section (around line 255, inside the mobile menu dropdown):

```tsx
{/* Mobile theme toggle — add after navItems.map or before the login/logout button */}
<button
  onClick={() => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  }}
  className="flex items-center gap-3 px-4 py-3 text-sm text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors w-full"
>
  {isLight ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
  )}
  <span>{isLight ? "Dark Mode" : "Light Mode"}</span>
</button>
```

---

### Task 4: Add light mode CSS overrides to globals.css

**Description:** Add all `.light` CSS rules for background, text colors, headlines, navbar, borders, inputs, and scrollbar.

**Files:** `frontend/src/app/globals.css`

---

**[GREEN]** Append the following CSS at the end of `globals.css` (before the `@media (prefers-reduced-motion)` block):

```css
/* ========= Light Mode Overrides ========= */
.light body {
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1) 0%, rgba(243, 232, 255, 1) 50%, rgba(233, 213, 255, 1) 100%) no-repeat fixed;
  background-color: #F5F3FF;
  color: #1A1A2E;
}

/* Light mode text colors */
.light .text-\[#F4F4F5\] { color: #1A1A2E !important; }
.light .text-\[#A1A1AA\] { color: #52525B !important; }
.light .text-\[#D4D4D8\] { color: #3F3F46 !important; }
.light .text-\[#71717A\] { color: #52525B !important; }
.light .text-white:where(:not(.aether-btn-primary *):not(.aether-badge *):not(nav *)) { color: #1A1A2E !important; }

/* Light mode headlines: black → dark purple vertical gradient */
.light h1.bg-gradient-to-b,
.light .bg-gradient-to-b.from-white {
  background: linear-gradient(to bottom, #1A1A2E, #6366F1) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

/* Light mode aether-text-gradient */
.light .aether-text-gradient {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Light mode Navbar */
.light nav:where(.fixed) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-bottom-color: rgba(99, 102, 241, 0.2) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08) !important;
}

/* Light mode Navbar text */
.light nav .text-\[#F4F4F5\] { color: #1A1A2E !important; }
.light nav .text-\[#A1A1AA\] { color: #52525B !important; }
.light nav .text-\[#818CF8\] { color: #6366F1 !important; }

/* Light mode borders */
.light .border-white\/10 { border-color: rgba(99, 102, 241, 0.15) !important; }
.light .border-white\/5 { border-color: rgba(99, 102, 241, 0.08) !important; }

/* Light mode inputs */
.light input,
.light select,
.light textarea {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
  color: #1A1A2E !important;
}

/* Light mode table rows hover */
.light .hover\:bg-white\/\[0\.04\]:hover { background: rgba(99, 102, 241, 0.04) !important; }
.light .hover\:bg-white\/\[0\.02\]:hover { background: rgba(99, 102, 241, 0.02) !important; }

/* Light mode dividers */
.light .divide-white\/10 > * + * { border-color: rgba(99, 102, 241, 0.1) !important; }
.light .divide-white\/5 > * + * { border-color: rgba(99, 102, 241, 0.05) !important; }

/* Light mode badge */
.light .aether-badge {
  color: #6366F1;
  border-color: rgba(99, 102, 241, 0.25);
  background: rgba(99, 102, 241, 0.08);
}

/* Light mode scrollbar */
.light ::-webkit-scrollbar-track {
  background: rgba(243, 232, 255, 0.5);
}

/* Light mode page wrapper backgrounds */
.light .bg-white\/5 { background: rgba(99, 102, 241, 0.05) !important; }
.light .bg-white\/\[0\.02\] { background: rgba(99, 102, 241, 0.02) !important; }

/* Light mode footer/text-muted in page wrappers */
.light .text-\[#6366F1\] { color: #4F46E5 !important; }
```

---

### Task 5: Verify build and test

**Description:** Ensure the application builds and runs without errors.

**Files:** N/A

---

**[GREEN]** Run the build:

```bash
cd frontend && npm run build
```

**Expected:** Build succeeds with no errors.

**[GREEN]** Start dev server and manually verify:

1. Open the app — should still be in dark mode by default
2. Click the sun icon in Navbar — should switch to light mode
3. Verify background is white + lavender gradient
4. Verify all headlines have black → dark purple gradient
5. Verify gradient cards (aether-glass) are unchanged
6. Refresh the page — light mode should persist
7. Click the moon icon — should switch back to dark mode
8. Verify all pages render correctly in both modes

---

## Self-Review Checklist

- [x] **Spec coverage:** Every requirement from the spec is covered by a task:
  - FR-1 (toggle button): Task 3
  - FR-2 (localStorage): Tasks 1, 3
  - FR-3 (.light class): Tasks 1, 4
  - FR-4 (CSS overrides): Task 4
  - FR-5 (smooth transition): CSS handles this naturally
- [x] **Placeholder scan:** No TBDs, TODOs, or incomplete sections
- [x] **Type consistency:** ThemeProvider uses `ReactNode` for children, matches existing AppProviders pattern
- [x] **TDD compliance:** This is a CSS/UI feature — no business logic to unit test. Verification is manual via build + visual inspection.

---

## Execution Handoff

**Plan complete and saved to `.sdlc/SPEC017-frontend-light-mode-toggle/plan.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
