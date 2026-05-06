# Feature: Complete Notification System

> **Status:** Approved
> **Author:** Kilo
> **Date:** 2026-05-06
> **Related Issues:** N/A

---

## 1. Problem Statement

### 1.1 User Problem

The application has a toast notification system with 4 severity levels (success, error, warning, info) and a global error event bus, but:

- Only `success` and `error` are used in pages; `warning` and `info` never fire
- API/data fetch errors silently fail with `console.error` — user sees no feedback
- No form validation system exists — no field-level error messages, no validation schema
- Admin page uses native `alert()` / `confirm()` browser dialogs — inconsistent UI
- Dictionary CRUD operations in Studio silently succeed/fail
- Loading skeletons only exist on Dashboard, other pages use simple spinners
- `createNotificationService()` contains a React hooks bug (calling `useContext` outside component)
- Toast state grows unbounded (no cap on stored notifications)

### 1.2 Business Impact

Users get no feedback when things fail (data fetch, dictionary operations, library delete), causing confusion, repeated requests, and distrust in the application.

### 1.3 Success Criteria

- [ ] All silent error points display a user-facing toast notification
- [ ] All forms (login, settings, api-keys, activate) have field-level validation errors
- [ ] Admin page uses ConfirmModal instead of native browser dialogs
- [ ] Dictionary CRUD operations show toast on success and failure
- [ ] Warning and info severity toasts are used in appropriate contexts
- [ ] Voices and Library pages show skeleton loading instead of plain spinner
- [ ] `createNotificationService()` bug is fixed
- [ ] Toast state is capped to prevent memory growth

---

## 2. User Stories & Acceptance Criteria

### Story 1: Silent Data Fetch Errors Show Notification

**As a** user,
**I want** to see an error notification when data fails to load,
**so that** I know something went wrong and can retry.

#### Acceptance Criteria

- **Given** the Dashboard quota fetch fails,
  **When** the page loads,
  **Then** an error toast "Không thể tải thông tin quota" is displayed.

- **Given** the Voices list fetch fails,
  **When** the page loads,
  **Then** an error toast "Không thể tải danh sách voice" is displayed.

- **Given** the Pricing page user fetch fails,
  **When** the page loads,
  **Then** an error toast "Không thể tải thông tin người dùng" is displayed.

- **Given** a Library item delete fails,
  **When** the user confirms delete,
  **Then** an error toast "Không thể xóa bản ghi" is displayed.

### Story 2: Form Validation with Field-Level Errors

**As a** user,
**I want** to see per-field error messages when I submit invalid forms,
**so that** I know exactly what to fix before resubmitting.

#### Acceptance Criteria

- **Given** the Login form with empty email,
  **When** the user submits,
  **Then** a field error "Email không được để trống" appears below the email input with red border.

- **Given** the Login form with invalid email format,
  **When** the user submits,
  **Then** a field error "Email không hợp lệ" appears.

- **Given** the Login form with password shorter than 6 characters,
  **When** the user submits,
  **Then** a field error "Mật khẩu tối thiểu 6 ký tự" appears.

- **Given** the API Keys create form with empty name,
  **When** the user submits,
  **Then** a field error "Tên không được để trống" appears.

- **Given** the Activate form with empty code,
  **When** the user submits,
  **Then** a field error "Mã kích hoạt không được để trống" appears.

- **Given** the Settings test form with empty Gemini key,
  **When** the user submits,
  **Then** a field error "API key không được để trống" appears.

### Story 3: Admin Page Replaces Browser Dialogs with Modal

**As a** admin,
**I want** confirmation dialogs that match the app's visual design,
**so that** the experience is consistent across all pages.

#### Acceptance Criteria

- **Given** the admin clicks "Xóa" on a user,
  **When** the action triggers,
  **Then** a styled ConfirmModal appears with title "Xác nhận xóa", message, and Confirm/Cancel buttons.

- **Given** the admin confirms the action in the modal,
  **When** the action completes,
  **Then** a success toast appears instead of native `alert()`.

- **Given** the admin cancels in the modal,
  **When** they click Cancel or backdrop,
  **Then** no action is performed.

### Story 4: Dictionary Operations Show Toast Notifications

**As a** user in Studio,
**I want** confirmation when I add, edit, or delete dictionary entries,
**so that** I know the operation completed.

#### Acceptance Criteria

- **Given** the user adds a word to the dictionary,
  **When** the operation succeeds,
  **Then** a success toast "Đã thêm từ vào từ điển" is displayed.

- **Given** the user edits a dictionary entry,
  **When** the operation succeeds,
  **Then** a success toast "Đã cập nhật từ" is displayed.

- **Given** the user deletes a dictionary entry,
  **When** the operation succeeds,
  **Then** a success toast "Đã xóa từ" is displayed.

- **Given** any dictionary operation fails,
  **When** the error occurs,
  **Then** an error toast with a descriptive message is displayed.

### Story 5: Warning and Info Toasts in Context

**As a** user,
**I want** informative and warning notifications in appropriate situations,
**so that** I'm aware of relevant system states.

#### Acceptance Criteria

- **Given** the user's quota is below 10%,
  **When** the Dashboard loads,
  **Then** a warning toast "Bạn sắp hết quota. Hãy nâng cấp gói." is displayed.

- **Given** the user copies an API key to clipboard,
  **When** the copy succeeds,
  **Then** an info toast "Đã sao chép API key" is displayed.

### Story 6: Skeleton Loading on More Pages

**As a** user,
**I want** skeleton loading placeholders on Voices and Library pages,
**so that** the loading state looks polished and consistent.

#### Acceptance Criteria

- **Given** the Voices page is loading,
  **When** data is being fetched,
  **Then** skeleton voice cards (3-4 cards with shimmer) are displayed instead of a plain spinner.

- **Given** the Library page is loading,
  **When** data is being fetched,
  **Then** skeleton table rows (3-5 rows with shimmer) are displayed.

### Story 7: Notification System Bug Fixes

**As a** developer,
**I want** the notification system to be bug-free,
**so that** future code doesn't crash.

#### Acceptance Criteria

- **Given** the `createNotificationService()` function which calls `useContext` outside a component,
  **When** it is removed or refactored,
  **Then** no React hooks violation exists in the file.

- **Given** 50+ notifications firing rapidly,
  **When** the NotificationProvider receives them,
  **Then** the stored notifications array is capped at 20 items maximum, oldest removed first.

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Install `react-hook-form`, `zod`, `@hookform/resolvers` as frontend dependencies | Must |
| FR-2 | Create `frontend/src/lib/validators.ts` with zod schemas for all forms | Must |
| FR-3 | Create `frontend/src/components/form/FormField.tsx` — reusable input wrapper with label, required indicator, and error message display | Must |
| FR-4 | Refactor Login form to use `react-hook-form` + `zod` with `FormField` | Must |
| FR-5 | Refactor Settings (test API key) form to use `react-hook-form` + `zod` with `FormField` | Must |
| FR-6 | Refactor API Keys create form (CreateKeyModal) to use `react-hook-form` + `zod` with `FormField` | Must |
| FR-7 | Refactor Activate form to use `react-hook-form` + `zod` with `FormField` | Must |
| FR-8 | Create `frontend/src/components/ui/ConfirmModal.tsx` — reusable confirmation dialog | Must |
| FR-9 | Replace native `alert()`/`confirm()` in Admin page with `ConfirmModal` and toast | Must |
| FR-10 | Add error toast for Dashboard quota fetch failure | Must |
| FR-11 | Add error toast for Voices list fetch failure | Must |
| FR-12 | Add error toast for Pricing user fetch failure | Must |
| FR-13 | Add error toast for Library item delete failure | Must |
| FR-14 | Add success/error toasts for Dictionary CRUD operations in Studio | Must |
| FR-15 | Show warning toast when quota < 10% on Dashboard | Should |
| FR-16 | Show info toast when API key is copied to clipboard | Should |
| FR-17 | Create shared `SkeletonCard` component in `components/ui/` | Should |
| FR-18 | Replace spinner with skeleton on Voices `loading.tsx` | Should |
| FR-19 | Replace spinner with skeleton on Library `loading.tsx` | Should |
| FR-20 | Fix `createNotificationService()` hooks bug in `notification-store.tsx` | Must |
| FR-21 | Cap notifications state array at 20 items in `NotificationProvider` | Should |

### 3.2 Edge Cases

- Form submission with empty required fields: all field errors display simultaneously
- Form submission with API errors (e.g., duplicate email on register): toast displays alongside field errors
- Rapid dictionary add/delete: each operation shows its own toast, toasts stack correctly
- Quota fetch succeeds but returns 0: no warning toast (quota is known, not an error)
- Slow network: skeleton displays indefinitely until fetch completes or fails
- Multiple simultaneous fetch failures: each shows its own error toast
- Admin modal: clicking backdrop closes modal without action
- ConfirmModal with `variant="danger"`: confirm button is red

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Form validation fails | Field-level errors appear below each invalid input, submit does not proceed |
| Server returns validation errors | Toast shows error message; field errors clear on next user input |
| Dictionary CRUD API fails | Error toast with "Không thể thực hiện thao tác từ điển" |
| Library delete API fails | Error toast with "Không thể xóa bản ghi" |
| Data fetch fails (network) | Error toast with "Không thể tải dữ liệu. Vui lòng thử lại." |
| 50+ rapid notifications | Only 20 stored in state; 5 most recent rendered in ToastContainer |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Toast animations use `framer-motion` (already installed)
- Skeleton components use CSS animations (pure CSS, no layout thrashing)
- Form validation runs client-side only (no server roundtrip for basic checks)

### 4.2 Security

- No new security concerns — existing auth system unchanged
- Form validation sanitizes user input (zod schema constraints)

### 4.3 Constraints

- Platform: Next.js 16+ frontend (App Router)
- Dependencies to add: `react-hook-form`, `zod`, `@hookform/resolvers`
- Must work with existing `notification-store.tsx` and `ToastContainer.tsx`
- Must follow existing project patterns: Tailwind CSS, framer-motion animations, Vietnamese UI text
- Backend NOT modified — all changes in `frontend/`

---

## 5. Unit Test Cases (TDD)

> This project does not currently have a frontend testing framework configured (no Jest, Vitest, or Testing Library in package.json).
> Manual verification will be used for UI components. See §7.1 for test plan.

---

## 6. Boundaries

### [ALLOW] Always Do

- Use `react-hook-form` with `zod` resolver for all form validation
- Use existing `notificationService` for all toasts
- Follow existing component patterns (AnimatePresence, framer-motion, Tailwind)
- Use Vietnamese text for all user-facing messages

### [CAUTION] Ask First

- Adding new npm dependencies beyond the three listed (react-hook-form, zod, @hookform/resolvers)
- Modifying the `Notification` interface or `ToastContainer` structure
- Changing backend code

### [FORBID] Never Do

- Use native `alert()` or `confirm()` in any component
- Leave silent error handlers (`.catch(() => {})` without user notification)
- Break the existing notification event bus pattern
- Remove or change existing error boundary pages (error.tsx)
- Write production code before verifying manually

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | Status |
|-------------|-------------|--------|
| FR-1 | Verify `npm install` succeeds, packages in `package.json` | Pending |
| FR-2 | Manual: import validators and test schemas in console | Pending |
| FR-3 | Visual: FormField renders with label, error state, children | Pending |
| FR-4 | Manual: submit Login with empty fields → see errors; fill correctly → submit | Pending |
| FR-5 | Manual: submit Settings test with empty key → see error | Pending |
| FR-6 | Manual: submit CreateKeyModal with empty name → see error | Pending |
| FR-7 | Manual: submit Activate with empty code → see error | Pending |
| FR-8 | Visual: ConfirmModal opens/closes, triggers callbacks | Pending |
| FR-9 | Manual: admin delete action shows ConfirmModal; on confirm shows toast | Pending |
| FR-10 | Manual: mock network failure on Dashboard → see error toast | Pending |
| FR-11 | Manual: mock network failure on Voices → see error toast | Pending |
| FR-12 | Manual: mock network failure on Pricing → see error toast | Pending |
| FR-13 | Manual: mock delete failure on Library → see error toast | Pending |
| FR-14 | Manual: add/edit/delete dictionary entry → see toast | Pending |
| FR-15 | Manual: set quota to < 10% → see warning toast | Pending |
| FR-16 | Manual: copy API key → see info toast | Pending |
| FR-17 | Visual: SkeletonCard renders with shimmer animation | Pending |
| FR-18 | Visual: Voices loading state shows skeleton cards | Pending |
| FR-19 | Visual: Library loading state shows skeleton rows | Pending |
| FR-20 | Code review: verify `createNotificationService` no longer calls hooks | Pending |
| FR-21 | Code review: verify `NotificationProvider` caps array at 20 | Pending |
| Typecheck | Run `tsc --noEmit` — zero errors | Pending |
| Lint | Run `npm run lint` — zero errors | Pending |

### 7.2 Acceptance Checklist

- [ ] All user stories implemented
- [ ] All acceptance criteria met
- [ ] Edge cases handled
- [ ] No silent error handlers remain (`.catch(() => {})` without notification)
- [ ] No native `alert()` or `confirm()` remain in any component
- [ ] TypeScript typecheck passes
- [ ] Lint passes
- [ ] No boundary violations

---

## 8. Out of Scope

- Server-side form validation changes (all backend code untouched)
- Adding a frontend testing framework (Jest, Vitest, Testing Library)
- Modifying existing `error.tsx` error boundary pages
- Changing the `Notification` interface shape
- Internationalization beyond Vietnamese
- Replacing all modals with `ConfirmModal` (only Admin is in scope; API Keys modals retain their existing implementations)
- Undo/retry actions in toasts
- Progress/upload indicators
- Real-time API call response improvements

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-06 | v1.0 | Kilo | Initial spec | — | All |
