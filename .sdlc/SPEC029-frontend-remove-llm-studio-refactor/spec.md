# Feature: Remove LLM & Streamline Studio UX

> **Status:** Approved
> **Author:** Kilo + User
> **Date:** 2026-05-09
> **Related Issues:** Replaces SPEC008 design direction, supersedes SPEC025 (client Gemini tools)

---

## 1. Problem Statement

### 1.1 User Problem

The current Studio page has layout issues (zigzag workflow: trái → phải → trái → bottom), unnecessary LLM-dependent features (pronunciation check, grammar fix, smart chunking) that require users to bring their own Gemini API key, and a cluttered toolbar that distracts from the core TTS generation flow. The floating action bar creates eye-travel distance between voice settings and the generate button.

### 1.2 Business Impact

- Removing LLM dependencies eliminates API key friction for all users
- Simplifying the Studio page reduces cognitive load and speeds up the core workflow
- Cleaner architecture: no BYOK model, no PRO-tier gating for AI features

### 1.3 Success Criteria

- [ ] All Gemini/LLM code removed from both frontend and backend
- [ ] Studio page has clear left-to-right workflow: Text Input (main) → Controls (sidebar) → Generate → Preview
- [ ] State count reduced from ~15 to 9
- [ ] No regression in core TTS generation flow
- [ ] All existing tests pass + new tests for modified components

---

## 2. User Stories & Acceptance Criteria

### Story 1: Simplified Studio Layout

**As a** TTS user,
**I want** a clean 2-panel studio with text input as the main focus,
**so that** I can generate speech without distractions or unnecessary features.

#### Acceptance Criteria

- **Given** I open the Studio page,
  **When** the page loads,
  **Then** I see a compact inline header (no large Hero section), a large text input on the left, and voice/settings/dictionary/generate in a sticky right sidebar.

- **Given** I have not yet generated any audio,
  **When** I look at the left panel,
  **Then** the Preview area shows an empty state ("Chưa có audio — Nhập text và nhấn Generate").

- **Given** I am on mobile,
  **When** the page loads,
  **Then** all sections stack vertically in logical order: Voice → Speed → Text → Generate → Preview.

### Story 2: Generate Flow with Visual Feedback

**As a** TTS user,
**I want** clear visual feedback during and after generation,
**so that** I know the system is working and can immediately review the result.

#### Acceptance Criteria

- **Given** I have entered text and configured voice/speed,
  **When** I click Generate,
  **Then** the button shows a spinner + "Đang tạo...", the Preview area expands with a waveform pulse animation, and a "Dừng" cancel button appears.

- **Given** generation completes successfully,
  **When** the audio is ready,
  **Then** the Preview area shows the audio player, download buttons (MP3/WAV), and the audio autoplays after 100ms.

- **Given** generation fails,
  **When** an error occurs,
  **Then** the error message appears in the Preview area (red text) and a toast notification is shown.

### Story 3: Remove All LLM/Gemini Dependencies

**As a** platform maintainer,
**I want** to remove all Gemini/LLM code from the codebase,
**so that** the application has no dependency on external AI APIs and users don't need to bring their own API keys.

#### Acceptance Criteria

- **Given** I search the frontend codebase,
  **When** I look for Gemini/LLM imports,
  **Then** there are zero imports from `@/lib/gemini` or `@google/generative-ai` in studio, tts, or voice features.

- **Given** I search the backend codebase,
  **When** I look for LLM normalizer,
  **Then** the file `backend/app/services/llm_normalizer.py` does not exist.

- **Given** I test the TTS generate API,
  **When** I send a request without `X-LLM-API-Key` header,
  **Then** the backend processes the request normally using rule-based normalization only.

- **Given** I open the Settings page,
  **When** I look for the Gemini API key section,
  **Then** it no longer exists.

### Story 4: Clean Architecture — No Dead Code

**As a** developer,
**I want** all LLM-related components, state, and types removed,
**so that** the codebase is clean, smaller, and easier to maintain.

#### Acceptance Criteria

- **Given** I inspect the Studio page,
  **When** I review the component imports,
  **Then** PronunciationCheck, GrammarFixModal, and SmartChunking are not imported.

- **Given** I inspect the Studio page state,
  **When** I review useState/useEffect hooks,
  **Then** there is no `isPro`, `normMeta`, `chunks`, `isPronunciationOpen`, `isGrammarOpen`, `isChunkingOpen`, or `showSuccessCard` state.

- **Given** I inspect PreviewPanel,
  **When** I look for the normalization badge,
  **Then** there is no `NormalizationMeta` type usage or "AI Đã chuẩn hóa" badge.

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Page layout uses 2-panel grid: left `1fr` (Text Input + Preview), right `340px` (Voice + Speed + Dict + Generate) | Must |
| FR-2 | StudioHeader: compact inline bar with title + "Projects" link + "Library" button (replaces StudioHero) | Must |
| FR-3 | TextInput: large textarea with animated char counter, "Xóa" button, over-limit (5000) detection | Must |
| FR-4 | PreviewPanel: 3 distinct states (empty/loading/success) with AnimatePresence transitions | Must |
| FR-5 | Generate button: in sidebar, gradient with glow, spinner + "Đang tạo..." during generation | Must |
| FR-6 | Cancel button: appears next to Generate during generation, calls `cancelGeneration()` | Must |
| FR-7 | VoiceSelector, VoiceSettings, CustomDictionary: keep existing functionality, unchanged | Must |
| FR-8 | StudioLibraryDrawer: keep existing, no changes | Must |
| FR-9 | Remove `lib/gemini/` directory entirely from frontend | Must |
| FR-10 | Remove `backend/app/services/llm_normalizer.py` and its test file | Must |
| FR-11 | Remove `POST /api/tts/validate-key` endpoint from `backend/app/api/tts.py` | Must |
| FR-12 | Remove `X-LLM-API-Key` header handling from `/api/tts/generate` and frontend voice-api | Must |
| FR-13 | Remove Gemini API key input section from Settings page | Must |
| FR-14 | Remove `NormalizationMeta` type from backend schemas, frontend types, and PreviewPanel | Must |
| FR-15 | Remove PronunciationCheck, GrammarFixModal, SmartChunking components | Must |
| FR-16 | Remove toolbar section and floating action bar from Studio page | Must |
| FR-17 | Responsive: tablet `1fr / 280px`, mobile single-column stack | Should |
| FR-18 | Mobile: Generate button sticky at bottom | Should |

### 3.2 Edge Cases

- Voice API fails → fallback to hardcoded `vi_female` + `vi_male` voices (existing behavior, unchanged)
- Dictionary API fails → fallback to empty array, allow local add (existing behavior, unchanged)
- Text exceeds 5000 chars → char counter turns red, Generate button disabled, `onOverLimit` callback to parent
- Generate clicked with empty text → button is disabled (no-op)
- Generate clicked while already generating → button is disabled (no-op)
- User navigates away during generation → component unmounts, effect cleanup handled by hook
- Audio URL becomes stale on re-render → handled by `useCallback` + state reset on new generate

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Voice fetch fails | Fallback to hardcoded 2 voices + toast notification |
| TTS generate fails | Error message in PreviewPanel (red) + toast |
| Dictionary fetch fails | Empty dictionary array + toast |
| Text over 5000 chars | Red counter display, Generate disabled |
| localStorage unavailable | Default values used, no crash |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Page initial load: < 2s (voices + dictionary fetched in parallel)
- Generate button response: < 100ms (state update only, generation is async)
- Preview expand animation: 300ms ease-out
- No layout shift during state transitions (use fixed heights / AnimatePresence)

### 4.2 Security

- No API keys stored or transmitted (removed `localStorage("gemini_api_key")`, removed `X-LLM-API-Key` header)
- Existing auth token handling unchanged (Bearer token in Authorization header)

### 4.3 Constraints

- Platform: Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, TypeScript
- Backend: FastAPI, Python
- Must reuse existing Aether Glass design system (`.aether-glass`, `.aether-glass-wrapper`)
- Must reuse existing i18n system (`useT()`)
- Must reuse existing `useTtsGenerate` hook, `useLocalLibrary` hook, notification store
- No new dependencies

---

## 5. Unit Test Cases (TDD)

### 5.1 Test Case Registry

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | `StudioHeader.test.tsx` | Renders title + navigation links | RED |
| TC-02 | `StudioHeader.test.tsx` | Mobile hamburger menu toggle | RED |
| TC-03 | `PreviewPanel.test.tsx` | Empty state: shows placeholder | RED |
| TC-04 | `PreviewPanel.test.tsx` | Loading state: shows pulse animation | RED |
| TC-05 | `PreviewPanel.test.tsx` | Success state: shows audio player + download buttons | RED |
| TC-06 | `PreviewPanel.test.tsx` | Error state: shows red error message | RED |
| TC-07 | `studio/page.test.tsx` | Full generate flow (mock API) | RED |
| TC-08 | `studio/page.test.tsx` | Generate disabled when text empty | RED |
| TC-09 | `studio/page.test.tsx` | Generate disabled when text > 5000 | RED |
| TC-10 | `studio/page.test.tsx` | Voice fetch fallback on API error | RED |
| TC-11 | `studio/page.test.tsx` | Generate API error → error in Preview | RED |
| TC-12 | `studio/page.test.tsx` | No Gemini/LLM imports in page or components | RED |

### 5.2 Test Case Details

#### TC-01: StudioHeader renders title + navigation

**Given**: StudioHeader component mounted
**When**: rendered
**Then**: "TTS Studio" title visible + "Projects" link + "Library" button visible

#### TC-03 through TC-06: PreviewPanel states

**Given**: PreviewPanel with varying props
**When**: rendered with `audioUrl=null, loading=false` → empty state
**When**: rendered with `audioUrl=null, loading=true` → loading state
**When**: rendered with `audioUrl="test.mp3", loading=false` → success state
**When**: rendered with `error="Failed", loading=false` → error state
**Then**: Each state renders the correct UI elements

#### TC-07: Full generate flow

**Given**: Mocked voice API returns 2 voices, mock generate API returns audio URL
**When**: User selects voice, types text, clicks Generate
**Then**: Loading state appears → audio player appears with URL

#### TC-12: Regression — no LLM imports

**Given**: The full codebase after refactor
**When**: Running lint/typecheck
**Then**: Zero imports from `@/lib/gemini`, zero references to `callGemini`, `NormalizationMeta`, `X-LLM-API-Key` in Studio/TTS features

### 5.3 TDD Verification Checklist

Before marking each test case complete:

- [ ] **RED:** Test written first, before any implementation code
- [ ] **RED:** Ran test, confirmed it FAILS with expected error
- [ ] **RED:** Failure is because feature is missing (not typo in test)
- [ ] **GREEN:** Wrote minimal code to pass the test
- [ ] **GREEN:** Ran test, confirmed it PASSES
- [ ] **GREEN:** No other existing tests broke
- [ ] **REFACTOR:** Cleaned up if needed, tests stayed green

---

## 6. Boundaries

### [ALLOW] Always Do

- Run `npm run lint` and `npx tsc --noEmit` after each change
- Follow existing component patterns (Aether glass, framer-motion, useT)
- Use `useCallback` / `useMemo` for performance (match existing pattern)
- Toast notifications for async operation feedback

### [CAUTION] Ask First

- Modifying the `useTtsGenerate` hook internals
- Changing the TTS API contract (`/api/v1/tts/generate`)
- Adding new npm dependencies
- Changing Aether glass CSS classes or design tokens

### [FORBID] Never Do

- Write production code before writing test first
- Keep any Gemini/LLM import or reference in Studio/TTS code
- Remove rule-based normalizer (`backend/app/services/normalizer/` or `vietnameseNormalizer.ts`)
- Change voice-api.ts response types in a way that breaks other consumers
- Commit with `--no-verify`

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | TDD Status |
|-------------|-------------|------------|
| FR-1 | Integration (Studio page grid layout) | RED |
| FR-2 | Component (StudioHeader) | RED |
| FR-3 | Component (TextInput) — existing tests updated | GREEN (existing) |
| FR-4 | Component (PreviewPanel) | RED |
| FR-5 | Integration (Generate button in page) | RED |
| FR-6 | Integration (Cancel button) | RED |
| FR-7 | Component — existing tests pass | GREEN (existing) |
| FR-8 | Component — existing tests pass | GREEN (existing) |
| FR-9–16 | Regression (lint/typecheck verifies removal) | RED |
| FR-17 | Manual + Playwright screenshot | Pending |
| FR-18 | Manual | Pending |

### 7.2 Acceptance Checklist

- [ ] All 4 user stories implemented
- [ ] All acceptance criteria met
- [ ] Edge cases handled
- [ ] Error states render correctly
- [ ] `npm run lint` passes (0 errors)
- [ ] `npx tsc --noEmit` passes (0 errors)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (no regressions)
- [ ] `cd backend && python -m pytest tests/` passes
- [ ] Zero Gemini/LLM imports anywhere in Studio/TTS feature code
- [ ] `backend/app/services/llm_normalizer.py` does not exist
- [ ] Settings page has no Gemini API key section
- [ ] Note: Pricing page still references AI features — update deferred to separate task

---

## 8. Out of Scope

- Adding new voice parameters (pitch, volume) — keep only existing speed slider
- Adding new export formats — keep existing MP3/WAV
- Changing the ONNX client-side TTS pipeline (`useTtsGenerate` hook)
- Changing the backend normalization pipeline (keep rule-based `services/normalizer/`)
- UI changes to Settings page beyond removing Gemini key section
- UI changes to Pricing page
- Mobile app or PWA support
- Keyboard shortcuts
- Undo/redo for text input

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-09 | v1.0 | Kilo | Initial spec | Brainstorming session with user | All |
