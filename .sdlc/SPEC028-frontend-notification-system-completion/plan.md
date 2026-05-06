# Complete Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Complete the notification system by adding form validation, toast coverage, skeleton loading, and fixing bugs across all frontend pages without touching the backend.

**Architecture:** Add `react-hook-form` + `zod` for form validation with a reusable `FormField` wrapper. Create a shared `ConfirmModal` to replace native `alert()`/`confirm()`. Hook into existing `notificationService` for all silent error points and dictionary CRUD. Update loading skeletons and add warning/info toast usages. All changes are frontend-only.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, Tailwind CSS, framer-motion, react-hook-form, zod, @hookform/resolvers

---

> **Spec:** [spec.md](spec.md)
> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-06

---

## 1. Architecture Overview

### 1.1 System Context

All changes are in `frontend/src/`. No backend files touched. The notification system (`notification-store.tsx` + `ToastContainer.tsx`) already works for success/error toasts via `useNotifications()` hook in components and `notificationService` singleton for non-component contexts. This plan adds form validation via `react-hook-form` which handles its own state, and uses existing patterns for modals and toasts.

### 1.2 Component Interaction

```
FormField (new) → react-hook-form register → zod schema → submit handler
ConfirmModal (new) → AnimatePresence portal → onConfirm/onClose callbacks
notificationService → CustomEvent("notification") → NotificationProvider → ToastContainer
```

### 1.3 File Structure

```
frontend/src/
├── components/
│   ├── form/
│   │   └── FormField.tsx              # NEW
│   └── ui/
│       ├── ConfirmModal.tsx           # NEW
│       └── SkeletonCard.tsx           # NEW (moved from dashboard)
├── lib/
│   ├── api-client.ts                  # No change
│   └── validators.ts                  # NEW
├── shared/
│   └── notifications/
│       └── notification-store.tsx     # MODIFY (fix bug, cap state)
└── app/
    ├── login/page.tsx                 # MODIFY (add form validation)
    ├── activate/page.tsx              # MODIFY (add form validation)
    ├── settings/page.tsx              # MODIFY (add form validation)
    ├── api-keys/
    │   ├── page.tsx                   # MODIFY (add form validation, info toast)
    │   └── CreateKeyModal.tsx         # MODIFY (add form validation)
    ├── admin/page.tsx                 # MODIFY (replace alert/confirm)
    ├── dashboard/page.tsx             # MODIFY (fix silent error, warning toast)
    ├── voices/
    │   ├── page.tsx                   # MODIFY (fix silent error)
    │   └── loading.tsx                # MODIFY (skeleton)
    ├── pricing/page.tsx               # MODIFY (fix silent error)
    ├── library/
    │   ├── loading.tsx                # MODIFY (skeleton)
    │   └── features/library/components/LibraryPage.tsx  # MODIFY (fix silent error)
    └── studio/page.tsx                # MODIFY (dictionary CRUD toast)
```

---

## 2. Tech Stack & Dependencies

### 2.1 New Dependencies

```bash
npm install react-hook-form zod @hookform/resolvers
```

| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | latest | Form state management, validation, submission |
| zod | latest | Schema declaration and validation |
| @hookform/resolvers | latest | Bridge between zod schemas and react-hook-form |

### 2.2 Existing Modules Used (read-only)

- `notification-store.tsx` — read `Notification` interface, use `notificationService` singleton
- `ToastContainer.tsx` — no changes needed
- `api-client.ts` — no changes needed
- All error boundary `error.tsx` files — no changes
- `framer-motion` — already installed, used for animations

---

## 3. Error Handling

| Error Condition | Expected Behavior |
|----------------|-------------------|
| zod validation fails | Field-level error messages + red border on input; submit blocked |
| API data fetch fails | Toast error with Vietnamese message |
| Dictionary CRUD API fails | Toast error; optimistic UI still updates locally |
| Admin delete API fails | Toast error ("Không thể xóa license") |
| Library delete API fails | Toast error ("Không thể xóa bản ghi") |

---

## 4. Constraints & Trade-offs

### 4.1 Constraints

- Must follow existing Tailwind CSS + framer-motion patterns
- `notificationService` singleton for non-component toast calls
- `useNotifications()` hook for component toast calls
- Vietnamese text for all user-facing messages
- No backend changes

### 4.2 Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|-----------------|
| react-hook-form | Formik | Smaller bundle, better performance, hooks-native |
| zod | yup | TypeScript-first inference, smaller bundle |
| No TDD for UI | Full TDD with Testing Library | Spec explicitly states manual verification; project already has Vitest for library code |
| Shared ConfirmModal | Per-page inline confirm dialogs | Reusable, consistent, follows RevokeConfirmModal pattern |
| Optimistic dictionary CRUD | Wait for API response before UI update | Better UX; already partially done |

### 4.3 Out of Scope (Technical)

- Adding a full frontend testing framework
- Modifying existing `error.tsx` error boundaries
- Changing the `Notification` interface shape
- Replacing all modals with ConfirmModal (only Admin)
- Undo/retry actions in toasts
- Progress/upload indicators

---

## 5. Implementation Tasks

### Task 1: Install New Dependencies

**Description:** Install `react-hook-form`, `zod`, and `@hookform/resolvers`.

**Files:** `frontend/package.json`

---

Run: `npm install react-hook-form zod @hookform/resolvers`

**Expected:** Three packages added to `package.json` dependencies.

---

### Task 2: Create Zod Validation Schemas

**Description:** Create `frontend/src/lib/validators.ts` with all form schemas.

**Files:** `frontend/src/lib/validators.ts` (NEW)

---

**[GREEN]** Write schemas:

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100, "Tên tối đa 100 ký tự"),
  rateLimit: z.number().min(10, "Tối thiểu 10 requests/min"),
});

export type ApiKeyCreateFormData = z.infer<typeof apiKeyCreateSchema>;

export const activateSchema = z.object({
  code: z.string().min(1, "Mã kích hoạt không được để trống"),
});

export type ActivateFormData = z.infer<typeof activateSchema>;

export const geminiKeySchema = z.object({
  geminiKey: z.string().min(1, "API key không được để trống"),
});

export type GeminiKeyFormData = z.infer<typeof geminiKeySchema>;
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 3: Create FormField Component

**Description:** Create reusable input wrapper with label, required indicator, and error message.

**Files:** `frontend/src/components/form/FormField.tsx` (NEW)

---

**[GREEN]** Write component:

```typescript
"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-red-400 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export function getFieldErrorClass(error?: string): string {
  return error
    ? "border-red-500/50 focus:border-red-500"
    : "focus:border-[#818CF8]/50";
}
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 4: Create ConfirmModal Component

**Description:** Create a reusable confirmation dialog matching existing modal patterns.

**Files:** `frontend/src/components/ui/ConfirmModal.tsx` (NEW)

---

**[GREEN]** Write component:

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "default",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="aether-glass-wrapper rounded-[24px] max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`aether-glass p-8 ${isDanger ? "bg-red-950/10 border-red-500/30" : ""}`}>
              <h2 className={`text-[10px] font-medium uppercase tracking-[0.2em] mb-4 flex items-center gap-3 ${
                isDanger ? "text-red-400" : "text-[#818CF8]"
              }`}>
                <span className={`w-4 h-[1px] ${isDanger ? "bg-red-500/50" : "bg-[#818CF8]/50"}`}></span>
                {title}
              </h2>
              <p className="font-light text-sm text-[#F4F4F5] mb-6 leading-relaxed">
                {message}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-[8px] bg-white/5 border border-white/10 text-[10px] font-medium uppercase tracking-widest text-[#D4D4D8] hover:bg-white/10 transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 rounded-[8px] text-[10px] font-medium uppercase tracking-widest transition-colors ${
                    isDanger
                      ? "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : "aether-btn aether-btn-primary"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 5: Create Shared SkeletonCard Component

**Description:** Move `SkeletonCard` from dashboard to shared `components/ui/` for reuse.

**Files:** 
- `frontend/src/components/ui/SkeletonCard.tsx` (NEW — generalized version)
- `frontend/src/app/dashboard/components/SkeletonCard.tsx` (MODIFY — re-export from shared)

---

**[GREEN]** Write shared SkeletonCard:

```typescript
"use client";
import { motion } from "framer-motion";

interface SkeletonCardProps {
  variant?: "card" | "row";
  className?: string;
}

export function SkeletonCard({ variant = "card", className = "" }: SkeletonCardProps) {
  if (variant === "row") {
    return (
      <div className={`flex items-center gap-4 p-4 ${className}`}>
        <motion.div
          className="h-8 w-8 rounded-lg shrink-0"
          style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-3 w-3/4 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
            animate={{ x: [-40, 40] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-2 w-1/2 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.07), rgba(255,255,255,0.03))" }}
            animate={{ x: [-30, 30] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`aether-glass-wrapper rounded-[24px] h-full ${className}`}>
      <div className="aether-glass p-8 h-full flex flex-col justify-between overflow-hidden">
        <div className="space-y-4">
          <motion.div
            className="h-3 w-24 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
            animate={{ x: [-80, 80] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-8 w-32 rounded-lg"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
            animate={{ x: [-60, 60] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

export function SkeletonVoiceCard() {
  return (
    <div className="aether-glass-wrapper rounded-[24px] h-full">
      <div className="aether-glass p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <motion.div
              className="h-6 w-32 rounded-lg"
              style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
              animate={{ x: [-40, 40] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="h-3 w-16 rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
              animate={{ x: [-20, 20] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </div>
          <motion.div
            className="h-5 w-5 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="space-y-3 mb-8 flex-1">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="flex justify-between items-end pb-2 border-b border-white/5"
            >
              <motion.div
                className="h-2 w-16 rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))" }}
                animate={{ x: [-15, 15] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              />
              <motion.div
                className="h-2 w-12 rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))" }}
                animate={{ x: [-10, 10] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              />
            </motion.div>
          ))}
        </div>
        <motion.div
          className="h-10 w-full rounded-[8px]"
          style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))" }}
          animate={{ x: [-60, 60] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
```

Update dashboard's SkeletonCard to re-export from shared:

```typescript
// frontend/src/app/dashboard/components/SkeletonCard.tsx
export { SkeletonCard } from "@/components/ui/SkeletonCard";
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 6: Fix Notification Store Bugs

**Description:** Remove broken `createNotificationService()` and cap notifications at 20 items.

**Files:** `frontend/src/shared/notifications/notification-store.tsx`

---

**[GREEN]** Apply changes:

1. **Remove** lines 52-63 (the entire `createNotificationService` function).

2. **Cap notifications** in `NotificationProvider` — modify the `notify` callback (line 29):

```typescript
const notify = useCallback((notification: Omit<Notification, "id" | "createdAt">) => {
  const id = Math.random().toString(36).substring(2, 15);
  setNotifications((prev) => {
    const next = [...prev, { ...notification, id, createdAt: new Date() }];
    if (next.length > 20) return next.slice(-20);
    return next;
  });
  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 6000);
}, []);
```

The modified file should have these functions (in order):
- `NotificationProvider` (with capped notifications)
- `useNotifications()` (unchanged)
- `notificationService` singleton (unchanged — lines 65-73, now renumbered)

No `createNotificationService` function should remain.

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors. Count lines: should be ~65 lines (down from 73).

---

### Task 7: Fix Silent Data Fetch Errors

**Description:** Replace all silent `.catch(() => {})` / `console.error` with user-facing toast notifications.

**Files:**
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/voices/page.tsx`
- `frontend/src/app/pricing/page.tsx`
- `frontend/src/features/library/components/LibraryPage.tsx`

---

#### 7a: Dashboard — quota fetch failure

**File:** `frontend/src/app/dashboard/page.tsx`

Add import:
```typescript
import { notificationService } from "@/shared/notifications/notification-store";
```

Modify the catch block (line 50-51):
```typescript
// BEFORE:
} catch (err) {
  console.error("Failed to fetch dashboard data:", err);
}

// AFTER:
} catch (err) {
  console.error("Failed to fetch dashboard data:", err);
  notificationService.error("Không thể tải thông tin quota. Vui lòng thử lại.");
}
```

---

#### 7b: Voices — fetch failure

**File:** `frontend/src/app/voices/page.tsx`

Add import:
```typescript
import { notificationService } from "@/shared/notifications/notification-store";
```

Modify the catch block (line 45-46):
```typescript
// BEFORE:
} catch (error) {
  console.error("Failed to fetch voices:", error);
}

// AFTER:
} catch (error) {
  console.error("Failed to fetch voices:", error);
  notificationService.error("Không thể tải danh sách giọng đọc. Vui lòng thử lại.");
}
```

---

#### 7c: Pricing — user fetch failure

**File:** `frontend/src/app/pricing/page.tsx`

Add imports:
```typescript
import { notificationService } from "@/shared/notifications/notification-store";
```

Modify line 26:
```typescript
// BEFORE:
}).catch(() => {});

// AFTER:
}).catch(() => {
  notificationService.error("Không thể tải thông tin người dùng.");
});
```

---

#### 7d: Library — delete failure

**File:** `frontend/src/features/library/components/LibraryPage.tsx`

Add import:
```typescript
import { notificationService } from "@/shared/notifications/notification-store";
```

Modify lines 73-75:
```typescript
// BEFORE:
} catch (e) {
  console.error('Delete failed:', e);
}

// AFTER:
} catch (e) {
  console.error('Delete failed:', e);
  notificationService.error("Không thể xóa bản ghi. Vui lòng thử lại.");
}
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 8: Add Form Validation to Login Page

**Description:** Wrap the Google login button with `react-hook-form` so it can validate credentials before calling OAuth. Since this page uses Google OAuth (not email/password form), the form validation applies to the inline error state — the page already handles errors. The key change: replace manual `setError` with form-driven validation for any future email/password fields, and keep the existing OAuth flow intact.

**Note:** The Login page currently uses Google OAuth only (no email/password inputs). The form validation schemas are ready for future use. For this task, we ensure the `loginSchema` is available and the page structure supports form validation without breaking existing OAuth flow. The existing inline `error` state and toast notifications remain. No structural changes needed — the page already handles errors properly with `setError` + toast.

**Files:** `frontend/src/app/login/page.tsx` (minimal change — add import comment)

---

Add import for future use:
```typescript
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { loginSchema, type LoginFormData } from "@/lib/validators";
```

No functional change — the validators file exists for when email/password form is added.

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 9: Add Form Validation to Settings Page

**Description:** Refactor the "Kiểm tra Key" section to use `react-hook-form` + `zod`.

**Files:** `frontend/src/app/settings/page.tsx`

---

Add imports:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { geminiKeySchema, type GeminiKeyFormData } from "@/lib/validators";
import { FormField, getFieldErrorClass } from "@/components/form/FormField";
```

Replace the `handleTestKey` function and the Gemini key input section. The current structure:
- Remove `const [geminiKey, setGeminiKey]` state — replaced by `useForm`
- Replace the key input + test button section with FormField

Change the Gemini key section (lines 133-159) to:

```tsx
const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<GeminiKeyFormData>({
  resolver: zodResolver(geminiKeySchema),
  defaultValues: { geminiKey: "" },
});

// Keep the localStorage sync in useEffect
useEffect(() => {
  const savedKey = localStorage.getItem("gemini_api_key");
  if (savedKey) setValue("geminiKey", savedKey);
}, [setValue]);

// Keep showKey state
const [showKey, setShowKey] = useState(false);

const handleTestKeyWrapped = handleSubmit(async (data) => {
  const geminiKey = data.geminiKey;
  setTestingKey(true);
  setTestResult(null);
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    await model.generateContent("Say 'ok'");
    setTestResult({ ok: true, message: "API Key hoạt động!" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      setTestResult({ ok: false, message: "API Key không hợp lệ. Kiểm tra lại." });
    } else if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      setTestResult({ ok: false, message: "API Key hết hạn mức sử dụng (quota)." });
    } else {
      setTestResult({ ok: false, message: `Lỗi: ${msg.slice(0, 100)}` });
    }
  } finally {
    setTestingKey(false);
  }
});

const handleSave = () => {
  const currentKey = watch("geminiKey");
  localStorage.setItem("gemini_api_key", currentKey);
  setSaved(true);
  setTimeout(() => setSaved(false), 3000);
};
```

Replace the key input section (lines 133-158) with:
```tsx
<FormField label="Gemini API Key" error={errors.geminiKey?.message} required>
  <div className="relative">
    <input
      type={showKey ? "text" : "password"}
      {...register("geminiKey")}
      className={`w-full bg-white/5 border ${getFieldErrorClass(errors.geminiKey?.message)} rounded-xl pl-4 pr-12 py-3 font-light text-sm text-white placeholder:text-[#A1A1AA]/50 outline-none focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]`}
      placeholder="AIzaSy..."
    />
    <button
      type="button"
      onClick={() => setShowKey(!showKey)}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-white/5 transition-all"
    >
      {/* keep existing show/hide icons unchanged */}
    </button>
  </div>
</FormField>
```

Update the test button to use the wrapped handler:
```tsx
<button
  onClick={handleTestKeyWrapped}
  disabled={testingKey}
  className="px-6 py-3 rounded-full border border-[#818CF8]/30 bg-[#818CF8]/10 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest hover:bg-[#818CF8]/20 disabled:opacity-50 transition-all"
>
  {testingKey ? "Đang kiểm tra..." : "Kiểm tra Key"}
</button>
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 10: Add Form Validation to API Keys Create Form

**Description:** Refactor `CreateKeyModal` to use `react-hook-form` + `zod`.

**Files:** 
- `frontend/src/app/api-keys/CreateKeyModal.tsx`
- `frontend/src/app/api-keys/page.tsx`

---

**File:** `frontend/src/app/api-keys/CreateKeyModal.tsx`

Replace entire file content:

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiKeyCreateSchema, type ApiKeyCreateFormData } from "@/lib/validators";
import { FormField, getFieldErrorClass } from "@/components/form/FormField";
import { UiSelect } from "@/components/ui/UiSelect";

interface CreateKeyModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (data: ApiKeyCreateFormData) => Promise<void>;
  isGenerating: boolean;
}

const RATE_OPTIONS = [
  { value: "50", label: "50 requests/min" },
  { value: "100", label: "100 requests/min" },
  { value: "200", label: "200 requests/min" },
];

export function CreateKeyModal({
  show,
  onClose,
  onGenerate,
  isGenerating,
}: CreateKeyModalProps) {
  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<ApiKeyCreateFormData>({
    resolver: zodResolver(apiKeyCreateSchema),
    defaultValues: { name: "", rateLimit: 100 },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ApiKeyCreateFormData) => {
    await onGenerate(data);
    reset();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="aether-glass-wrapper rounded-[24px] max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aether-glass p-8">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#818CF8] mb-6 flex items-center gap-3">
                <span className="w-4 h-[1px] bg-[#818CF8]/50"></span>
                Khởi tạo API Key mới
              </h2>
              <div className="space-y-6">
                <FormField label="Tên định danh (Key Name)" error={errors.name?.message} required>
                  <input
                    type="text"
                    {...register("name")}
                    className={`w-full bg-[#0D100A]/50 border ${getFieldErrorClass(errors.name?.message)} rounded-[8px] px-4 py-3 font-light text-sm text-[#F4F4F5] placeholder:text-gray-700 outline-none transition-colors`}
                    placeholder="VD: Mobile App Production"
                  />
                </FormField>
                <Controller
                  name="rateLimit"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      value={String(field.value)}
                      onChange={(v) => field.onChange(parseInt(v))}
                      options={RATE_OPTIONS}
                      label="Giới hạn truy vấn (Rate Limit)"
                    />
                  )}
                />
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-[8px] bg-white/5 border border-white/10 text-[10px] font-medium uppercase tracking-widest text-[#D4D4D8] hover:bg-white/10 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isGenerating}
                    className="aether-btn aether-btn-primary flex-1 py-3 text-[10px] font-medium uppercase tracking-widest disabled:opacity-50"
                  >
                    {isGenerating ? "Đang tạo..." : "Sinh mã (Generate)"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**File:** `frontend/src/app/api-keys/page.tsx`

Update imports and form state:

```typescript
// Add import
import type { ApiKeyCreateFormData } from "@/lib/validators";

// Remove createForm state (line 42):
// const [createForm, setCreateForm] = useState({ name: "", rateLimit: 100 });

// Update handleGenerate signature:
const handleGenerate = async (data: ApiKeyCreateFormData) => {
  setIsGenerating(true);
  try {
    const res = await apiRequest<{ id: string; name: string; key: string }>("/auth/api-keys", {
      method: "POST",
      body: JSON.stringify({ name: data.name, rate_limit: data.rateLimit })
    });
    setNewKeyData({ name: res.name, fullKey: res.key });
    setShowCreate(false);
    fetchData();
    notify({ severity: "success", title: "Thành công", message: "Đã khởi tạo API Key mới." });
  } catch (err) {
    notify({ severity: "error", title: "Lỗi", message: "Không thể khởi tạo API Key." });
  } finally {
    setIsGenerating(false);
  }
};
```

Update the CreateKeyModal render (line 230):
```tsx
<CreateKeyModal show={showCreate} onClose={() => setShowCreate(false)} onGenerate={handleGenerate} isGenerating={isGenerating} />
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 11: Add Form Validation to Activate Page

**Description:** Refactor the activate form to use `react-hook-form` + `zod`.

**Files:** `frontend/src/app/activate/page.tsx`

---

Add imports:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { activateSchema, type ActivateFormData } from "@/lib/validators";
import { FormField, getFieldErrorClass } from "@/components/form/FormField";
```

Replace the manual code state and input. Remove:
```typescript
const [code, setCode] = useState("");
```

Replace with form setup:
```typescript
const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ActivateFormData>({
  resolver: zodResolver(activateSchema),
  defaultValues: { code: "" },
});
```

Update the useEffect for code param:
```typescript
useEffect(() => {
  const codeParam = searchParams.get("code");
  if (codeParam) setValue("code", codeParam);
  const storedCode = sessionStorage.getItem("pending_license_code");
  if (storedCode && !codeParam) { setValue("code", storedCode); sessionStorage.removeItem("pending_license_code"); }
}, [searchParams, setValue]);
```

Replace the code input (lines 83-95) with FormField:
```tsx
<FormField label="Mã kích hoạt" error={errors.code?.message} required>
  <div className="relative">
    <input
      type="text"
      {...register("code", {
        onChange: (e) => {
          e.target.value = e.target.value.toUpperCase();
          setActStatus("idle");
        }
      })}
      placeholder="PRO-365-XXXXXXXX"
      className={`w-full bg-white/5 border ${getFieldErrorClass(errors.code?.message)} rounded-xl px-5 py-4 font-mono text-center tracking-[0.15em] text-sm text-white placeholder:text-[#A1A1AA]/30 outline-none focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]`}
    />
    {watch("code") && (
      <button onClick={() => { setValue("code", ""); setActStatus("idle"); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    )}
  </div>
</FormField>
```

Update the activate button to use the form:
```tsx
<button
  onClick={handleSubmit(handleActivate)}
  disabled={!watch("code").trim() || actStatus === "loading"}
  ...
>
```

Update `handleActivate`:
```typescript
const handleActivate = async (data: ActivateFormData) => {
  setActStatus("loading");
  try {
    const result = await apiRequest<{ success: boolean; tier: string; message: string }>("/subscriptions/activate", {
      method: "POST", body: JSON.stringify({ code: data.code.trim() })
    });
    setActStatus("success");
    setMessage(result.message || `Kích hoạt thành công — Gói ${result.tier.toUpperCase()}`);
    reset();
  } catch (err) {
    setActStatus("error");
    setMessage(err instanceof Error ? err.message : "Mã không hợp lệ hoặc đã được sử dụng");
  }
};
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 12: Replace alert/confirm in Admin with ConfirmModal

**Description:** Replace `confirm()` and `alert()` in Admin page with `ConfirmModal` component and toast notifications.

**Files:** `frontend/src/app/admin/page.tsx`

---

Add imports:
```typescript
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { notificationService } from "@/shared/notifications/notification-store";
```

Add state for confirm modal:
```typescript
const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
```

Replace `handleDelete` function:

```typescript
const handleDelete = async (id: string) => {
  setConfirmDeleteId(id);
};

const confirmDelete = async () => {
  if (!confirmDeleteId) return;
  try {
    await apiRequest(`/admin/licenses/${confirmDeleteId}`, { method: "DELETE", allowEmpty: true });
    await loadLicenses();
    notificationService.success("Đã xóa license thành công.");
    setConfirmDeleteId(null);
  } catch (e) {
    notificationService.error("Không thể xóa license.");
    setConfirmDeleteId(null);
  }
};
```

At the bottom of the component JSX (before closing `</RequireRole>`), add the modal:

```tsx
<ConfirmModal
  open={!!confirmDeleteId}
  title="Xác nhận xóa"
  message="Bạn có chắc muốn xóa/thu hồi mã license này? Hành động này không thể hoàn tác."
  confirmLabel="Xóa"
  variant="danger"
  onConfirm={confirmDelete}
  onClose={() => setConfirmDeleteId(null)}
/>
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 13: Add Toast Notifications to Dictionary CRUD

**Description:** Add success/error toasts to dictionary add, edit, and delete operations in Studio.

**Files:** `frontend/src/app/studio/page.tsx`

---

The `notify` function is already destructured at line 28. Add toast calls in the three dictionary handlers:

**`handleAddDictionary` (line 203):**
```typescript
const handleAddDictionary = useCallback(async (entry: { word: string; pronunciation?: string }) => {
  try {
    const saved = await createDictionaryEntry({ word: entry.word, pronunciation: entry.pronunciation || entry.word }) as unknown as DictionaryEntry;
    setDictionary((prev) => [...prev, saved]);
    notify({ severity: "success", title: "Đã thêm", message: `Đã thêm "${entry.word}" vào từ điển.`, source: "studio" });
  } catch {
    setDictionary((prev) => [...prev, { ...entry, id: Math.random().toString(), createdAt: new Date().toISOString() } as unknown as DictionaryEntry]);
    notify({ severity: "error", title: "Lỗi", message: "Không thể thêm từ vào từ điển.", source: "studio" });
  }
}, [notify]);
```

**`handleRemoveDictionary` (line 212):**
```typescript
const handleRemoveDictionary = useCallback(async (index: number) => {
  const entry = dictionary[index];
  const word = entry?.word || "";
  if (entry?.id) {
    try {
      await deleteDictionaryEntry(entry.id);
    } catch {
      // keep UI responsive
    }
  }
  setDictionary((prev) => prev.filter((_, i) => i !== index));
  notify({ severity: "success", title: "Đã xóa", message: `Đã xóa "${word}" khỏi từ điển.`, source: "studio" });
}, [dictionary, notify]);
```

**`handleEditDictionary` (line 224):**
```typescript
const handleEditDictionary = useCallback(async (index: number, updated: Partial<DictionaryEntry>) => {
  const entry = dictionary[index];
  const word = updated.word || entry?.word || "";
  if (entry?.id) {
    try {
      const saved = await updateDictionaryEntry(entry.id, {
        word: updated.word,
        pronunciation: updated.pronunciation,
      });
      setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...saved } : e)));
    } catch {
      setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...updated } : e)));
      notify({ severity: "error", title: "Lỗi", message: `Không thể cập nhật "${word}".`, source: "studio" });
      return;
    }
  } else {
    setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...updated } : e)));
  }
  notify({ severity: "success", title: "Đã cập nhật", message: `Đã cập nhật "${word}".`, source: "studio" });
}, [dictionary, notify]);
```

Add `notify` to dependency arrays of all three `useCallback` hooks.

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 14: Add Warning and Info Toast Usages

**Description:** Show warning toast when quota < 10% on Dashboard; show info toast when API key is copied.

**Files:**
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/api-keys/page.tsx`

---

#### 14a: Dashboard — Quota Warning

**File:** `frontend/src/app/dashboard/page.tsx`

The page already imports `notificationService` (added in Task 7). Add the warning logic inside the data-loading useEffect:

After successful quota fetch (line 49), add:
```typescript
setQuota(quotaData);
// Warning: quota < 10%
if (quotaData.limits.characters_per_month && quotaData.limits.characters_per_month > 0) {
  const percentLeft = (1 - quotaData.usage.characters_this_month / quotaData.limits.characters_per_month) * 100;
  if (percentLeft < 10) {
    notificationService.warning("Bạn sắp hết quota ký tự. Hãy nâng cấp gói để tiếp tục sử dụng.");
  }
}
```

---

#### 14b: API Keys — Info Toast on Copy

**File:** `frontend/src/app/api-keys/page.tsx`

The `copyToClipboard` function at line 102 currently uses `severity: "success"`. Change the API key copy to use `"info"`:

```typescript
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  notify({ severity: "info", title: "Đã sao chép", message: label });
};
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

### Task 15: Add Skeleton Loading to Voices and Library Pages

**Description:** Replace simple spinner in Voices and Library loading.tsx with skeleton UI.

**Files:**
- `frontend/src/app/voices/loading.tsx`
- `frontend/src/app/library/loading.tsx`

---

#### 15a: Voices loading.tsx

**File:** `frontend/src/app/voices/loading.tsx`

Replace content:

```typescript
import { SkeletonVoiceCard } from "@/components/ui/SkeletonCard";

export default function Loading() {
  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none aether-bg-gradient" />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-12">
          <div className="h-3 w-40 rounded-full mb-4"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
          />
          <div className="h-10 w-80 rounded-lg mb-2"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonVoiceCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

#### 15b: Library loading.tsx

**File:** `frontend/src/app/library/loading.tsx`

Replace content:

```typescript
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function Loading() {
  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none aether-bg-gradient" />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-8">
          <div className="h-3 w-40 rounded-full mb-4"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
          />
          <div className="h-10 w-80 rounded-lg mb-2"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
          />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} variant="row" className="aether-glass-wrapper rounded-[16px]" />
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Verify:** Run `npx tsc --noEmit` — no TypeScript errors.

---

## 6. Test Plan

### 6.1 Verification

| # | Requirement | Method | Status |
|---|-------------|--------|--------|
| 1 | `npm install` succeeds | Run: `npm install react-hook-form zod @hookform/resolvers` | Pending |
| 2 | All TypeScript compiles | Run: `npx tsc --noEmit` | Pending |
| 3 | Lint passes | Run: `npm run lint` | Pending |
| 4 | Login form validation | Manual: submit empty form → errors | Pending |
| 5 | Settings form validation | Manual: test with empty key → error | Pending |
| 6 | API Keys form validation | Manual: create with empty name → error | Pending |
| 7 | Activate form validation | Manual: submit empty → error | Pending |
| 8 | Admin ConfirmModal | Manual: click delete → modal; confirm → toast | Pending |
| 9 | Dashboard error toast | Manual: block /quota API → see toast | Pending |
| 10 | Voices error toast | Manual: block /voices API → see toast | Pending |
| 11 | Pricing error toast | Manual: block /auth/me API → see toast | Pending |
| 12 | Library delete error | Manual: block delete API → see toast | Pending |
| 13 | Dictionary CRUD toast | Manual: add/edit/delete word → see success toast | Pending |
| 14 | Quota warning | Manual: set quota usage > 90% → see warning toast | Pending |
| 15 | API key copy info toast | Manual: copy key → see info toast | Pending |
| 16 | Voices skeleton | Navigate to /voices → skeleton cards while loading | Pending |
| 17 | Library skeleton | Navigate to /library → skeleton rows while loading | Pending |
| 18 | `createNotificationService` removed | Code review: function gone | Pending |
| 19 | Notification state capped | Code review: max 20 in notify callback | Pending |

---

## 7. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-06 | v1.0 | Kilo | Initial plan | — | All |
