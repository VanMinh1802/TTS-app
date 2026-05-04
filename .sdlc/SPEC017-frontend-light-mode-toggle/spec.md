# Feature: Light Mode Toggle with Dark/Light Theme Switch

> **Status:** Draft
> **Author:** Roo
> **Date:** 2026-05-04
> **Related Issues:** N/A

---

## 1. Problem Statement

### 1.1 User Problem

The application currently only supports a dark theme with purple/black gradients. Users who prefer working in bright environments or have visual preferences for light-colored UIs have no way to switch. This limits accessibility and user comfort.

### 1.2 Business Impact

Adding a light mode toggle improves user experience and accessibility, making the application more inclusive. It's a low-effort, high-impact UX improvement that modern web applications are expected to support.

### 1.3 Success Criteria

- [ ] User can toggle between dark and light mode via a button in the Navbar
- [ ] Preference persists across page reloads (localStorage)
- [ ] All pages render correctly in both dark and light mode
- [ ] Gradient cards (`.aether-glass`, `.aether-glass-wrapper`) remain visually consistent in both modes
- [ ] Headlines use vertical black→dark-purple gradient in light mode
- [ ] No regressions in dark mode appearance

---

## 2. User Stories & Acceptance Criteria

### Story 1: Toggle Theme

**As a** user,
**I want** to toggle between dark and light mode from the Navbar,
**so that** I can use the application in my preferred visual theme.

#### Acceptance Criteria

- **Given** I am on any page,
  **When** I click the theme toggle button in the Navbar,
  **Then** the application switches from dark to light mode (or vice versa).

- **Given** I have switched to light mode,
  **When** I refresh the page,
  **Then** light mode persists (stored in localStorage).

### Story 2: Light Mode Visual Design

**As a** user in light mode,
**I want** the interface to have a white + light purple gradient background with dark text,
**so that** content is readable in bright environments.

#### Acceptance Criteria

- **Given** light mode is active,
  **Then** the background is white → light lavender gradient
- **Given** light mode is active,
  **Then** all page headlines use a black → dark purple vertical gradient (`from-[#1A1A2E] to-[#6366F1]`)
- **Given** light mode is active,
  **Then** gradient cards (`.aether-glass`, `.aether-glass-wrapper`) remain unchanged
- **Given** light mode is active,
  **Then** body text is dark (`#1A1A2E`), secondary text is gray (`#52525B`)

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Theme toggle button in Navbar (desktop + mobile) | Must |
| FR-2 | Theme preference persisted in localStorage under key `theme` | Must |
| FR-3 | Apply `.light` class to `<html>` element when light mode is active | Must |
| FR-4 | All CSS theme variables switch via `.light` class selectors in `globals.css` | Must |
| FR-5 | Smooth transition between themes (150ms ease) | Should |
| FR-6 | System preference detection on first visit (`prefers-color-scheme`) | Could |

### 3.2 Edge Cases

- First-time visitor with no saved preference → default to dark mode (current behavior)
- JavaScript disabled → falls back to dark mode (no toggle rendered)
- System preference changes while app is open → no auto-switch (manual toggle only)

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| localStorage unavailable (private browsing) | Theme toggle works in-session but doesn't persist |
| Corrupted localStorage value | Fall back to dark mode, overwrite with valid value on next toggle |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Theme switch must be instant (CSS class toggle, no re-renders)
- No additional network requests

### 4.2 Security

- No sensitive data in theme preference
- No XSS vector (theme value is sanitized to `"dark"` or `"light"`)

### 4.3 Constraints

- Platform: Next.js 16+ (App Router)
- Dependencies: No new dependencies — uses existing Tailwind CSS + CSS custom properties
- Compatibility: Must work with existing Framer Motion animations, aether-glass system, and all page layouts

---

## 5. Implementation Plan

### 5.1 Architecture

**Approach:** CSS class-based theming via `.light` modifier on `<html>` element.

```
<html class="light">  ← toggled by ThemeProvider
```

All theme overrides live in `globals.css` under `.light` selectors. No changes to individual page components except Navbar (add toggle button).

### 5.2 Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/components/providers/ThemeProvider.tsx` | Client component that manages theme state, reads/writes localStorage, applies `.light` class to `<html>` |

### 5.3 Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/app/globals.css` | Add `.light` CSS rules for body background, text colors, headlines, navbar, borders, inputs |
| `frontend/src/components/layout/Navbar.tsx` | Add theme toggle button (sun/moon icon) next to user menu |
| `frontend/src/app/layout.tsx` | Wrap children with `<ThemeProvider>` |
| `frontend/src/app/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/dashboard/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/studio/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/settings/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/api-keys/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/admin/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/dictionary/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/voices/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/pricing/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/login/page.tsx` | Update text colors for light mode compatibility |
| `frontend/src/app/activate/page.tsx` | Update text colors for light mode compatibility |

### 5.4 CSS Theme Variables (globals.css)

```css
/* Light mode overrides */
.light body {
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1) 0%, rgba(243, 232, 255, 1) 50%, rgba(233, 213, 255, 1) 100%) no-repeat fixed;
  background-color: #F5F3FF;
  color: #1A1A2E;
}

.light .aether-text-gradient {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Light mode headlines: black → dark purple vertical gradient */
.light h1.bg-gradient-to-b.from-white,
.light .bg-gradient-to-b.from-white {
  background: linear-gradient(to bottom, #1A1A2E, #6366F1) !important;
}

/* Light mode Navbar */
.light nav {
  background: rgba(255, 255, 255, 0.9) !important;
  border-bottom-color: rgba(99, 102, 241, 0.2) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08) !important;
}

/* Light mode text colors */
.light .text-\[#F4F4F5\] { color: #1A1A2E !important; }
.light .text-\[#A1A1AA\] { color: #52525B !important; }
.light .text-\[#D4D4D8\] { color: #3F3F46 !important; }
.light .text-\[#71717A\] { color: #52525B !important; }
.light .text-white:not(.aether-btn-primary *) { color: #1A1A2E !important; }

/* Light mode borders */
.light .border-white\/10 { border-color: rgba(99, 102, 241, 0.15) !important; }
.light .border-white\/5 { border-color: rgba(99, 102, 241, 0.08) !important; }

/* Light mode inputs */
.light input, .light select, .light textarea {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
  color: #1A1A2E !important;
}

/* Light mode table rows */
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
```

### 5.5 ThemeProvider Component

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    
    if (stored === "light" || (!stored && prefersLight)) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    setMounted(true);
  }, []);

  // Avoid flash of wrong theme
  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
```

### 5.6 Navbar Toggle Button

Add a sun/moon icon button in the Navbar, positioned before the user menu:

```tsx
const [isLight, setIsLight] = useState(false);

useEffect(() => {
  setIsLight(document.documentElement.classList.contains("light"));
}, []);

const toggleTheme = () => {
  const next = !isLight;
  setIsLight(next);
  document.documentElement.classList.toggle("light", next);
  localStorage.setItem("theme", next ? "light" : "dark");
};

// In JSX, before user menu:
<button onClick={toggleTheme} className="...">
  {isLight ? <MoonIcon /> : <SunIcon />}
</button>
```

---

## 6. Boundaries

### [ALLOW] Always Do

- Use CSS class `.light` on `<html>` for all theme overrides
- Persist preference to localStorage
- Default to dark mode for first-time visitors

### [CAUTION] Ask First

- Changing gradient card (`.aether-glass`) styles — user explicitly said to keep them unchanged
- Adding new dependencies for theme switching

### [FORBID] Never Do

- Do NOT modify individual component files to add inline light-mode logic — all theming must be CSS-driven via `.light` class
- Do NOT change the dark mode appearance

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | Status |
|-------------|-------------|--------|
| FR-1: Toggle button in Navbar | Manual visual inspection | Pending |
| FR-2: localStorage persistence | Manual: toggle → refresh → verify | Pending |
| FR-3: `.light` class on `<html>` | Manual: inspect element | Pending |
| FR-4: All CSS overrides work | Manual: check each page in light mode | Pending |
| FR-5: Smooth transition | Manual visual inspection | Pending |

### 7.2 Acceptance Checklist

- [ ] Toggle button visible in Navbar (desktop + mobile)
- [ ] Clicking toggle switches between sun/moon icon
- [ ] Background switches to white + lavender gradient in light mode
- [ ] All headlines use black → dark purple vertical gradient in light mode
- [ ] Gradient cards (aether-glass) remain unchanged in light mode
- [ ] Body text is dark, readable in light mode
- [ ] Navbar adapts to light mode (white background, dark text)
- [ ] Preference persists after page refresh
- [ ] All 12+ pages render correctly in light mode
- [ ] Dark mode appearance has zero regressions

---

## 8. Out of Scope

- System preference auto-detection (`prefers-color-scheme`) — deferred to future enhancement
- Custom theme colors (only dark/light binary)
- Theme toggle in Settings page (Navbar only for now)
- Animating the theme transition

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Roo | Initial spec | — | All |
