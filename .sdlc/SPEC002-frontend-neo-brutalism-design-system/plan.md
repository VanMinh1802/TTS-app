# F2 Frontend Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `sdlc:subagent-driven-development` (recommended) or `sdlc:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khởi tạo base cấu trúc Next.js Frontend với Design System Neo-Brutalism và phông nền Teal Glow.

**Architecture:** Mở rộng configuration của Next.js 16 (App Router) kết hợp Tailwind v4. Tạo các component nền tảng dùng chung mang cá tính Brutalism (Solid Border, Hard Shadow). Đồng thời cài đặt Vitest/React Testing library để giữ kỷ luật TDD.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Vitest, Testing Library.

---

> **Spec:** [SPEC 002: Frontend Design System](../SPEC002-frontend-neo-brutalism-design-system/spec.md)
> **Status:** Review
> **Author:** Antigravity (Agent)
> **Date:** 2026-04-20

---

## 1. Architecture Overview

### 1.1 System Context
Frontend App đóng vai trò giao diện trực tiếp. Việc cấu hình Design System ngay từ đầu (Typography, Layout Wrapper, Components Core) sẽ giúp mọi Developer sau này kế thừa nhanh chóng mà không bị lệch style.

---

## 2. Tech Stack & Dependencies

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Testing | Vitest | ^1.0 | Nhanh, nhẹ, hỗ trợ TypeScript và ESM native so với Jest. |
| Testing UI | @testing-library/react | ^16 | Tiêu chuẩn để test component React 19. |
| UI Util | clsx, tailwind-merge | latest | Giúp gộp class Tailwind khi làm component |

### 2.1 New Dependencies
Thêm vào `frontend/package.json`:
- `vitest`, `@vitejs/plugin-react`, `jsdom`: Setup Vitest cho React.
- `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`: Rendering components in test.
- `clsx`, `tailwind-merge`: Chuẩn bị làm nền tảng cho Shadcn.

---

## 7. Test Strategy (TDD)

> **TDD Required:** Every task step must follow RED-GREEN-REFACTOR cycle.

### Task 1: Setup Testing Environment
**Description:** Cài đặt dependencies (vitest, testing-library) và cấu hình Test cho Next.js App.

**Files:** `frontend/package.json`, `frontend/vitest.config.ts`, `frontend/src/tests/setup.ts`

- [ ] **[RED]** Cập nhật `package.json` thêm test script `"test": "vitest run"` và thử chạy `npm test` -> Báo lỗi do thiếu file config hoặc command.
- [ ] **[GREEN]** Tạo `vitest.config.ts` để support react và environment `jsdom`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
});
```
- [ ] **[GREEN]** Khởi tạo class setup cơ bản: `src/tests/setup.ts` (import `@testing-library/jest-dom`).
- [ ] **[GREEN]** Cài đặt các package cần thiết qua thư mục `frontend`: `cd frontend && npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom`
- [ ] **[GREEN]** Chạy lại `npm test` -> PASS (với cảnh báo no test found).

### Task 2: Cấu hình Layout & Teal Glow Background
**Description:** Đưa Font `Space Grotesk` vào `layout.tsx` và thêm wrapper div có màu nền Teal Gradient.

**Files:** `frontend/src/app/layout.tsx`, `frontend/src/app/layout.test.tsx`

- [ ] **[RED]** Viết `layout.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import RootLayout from './layout';

describe('RootLayout', () => {
  test('TC-01: Layout includes Teal glow background properties', () => {
    const { container } = render(<RootLayout>Test Content</RootLayout>);
    const tealBgElement = container.querySelector('.bg-white .absolute');
    expect(tealBgElement).not.toBeNull();
    expect(tealBgElement?.getAttribute('style')).toContain('radial-gradient');
  });
});
```
- [ ] **[RED]** Run: `cd frontend && npm test` -> FAIL.
- [ ] **[GREEN]** Chỉnh sửa `src/app/layout.tsx` thêm biến Font Google `Space_Grotesk` và cấu trúc giao diện theo Spec002:
```tsx
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={spaceGrotesk.className}>
        <div className="min-h-screen w-full bg-white relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle 600px at 0% 200px, #a7f3d0, transparent), radial-gradient(circle 600px at 100% 200px, #a7f3d0, transparent)' }} />
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
```
- [ ] **[GREEN]** Run test -> PASS.

### Task 3: Neo-Brutalism Global Styles (CSS Variables)
**Description:** Cấu hình `globals.css` để định nghĩa custom classes cho Brutalism. Do Tailwind v4 sử dụng css thuần, ta định nghĩa trong lớp `@layer utilities` hoặc cấu hình theme trực tiếp.

**Files:** `frontend/src/app/globals.css`, `frontend/src/app/page.tsx`, `frontend/src/app/page.test.tsx`

- [ ] **[RED]** Cập nhật `page.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Page from './page';

describe('Home Page', () => {
  test('TC-02: Home page renders a brutalism card', () => {
    const { container } = render(<Page />);
    const card = container.querySelector('.border-4.border-black');
    expect(card).toBeInTheDocument();
  });
});
```
- [ ] **[RED]** Run `npm test` -> FAIL.
- [ ] **[GREEN]** Thêm đoạn mã tạo utility `shadow-brutal` vào `src/app/globals.css` (Cú pháp Tailwind v4):
```css
@import "tailwindcss";

@theme {
  --shadow-brutal: 4px 4px 0px 0px #000000;
  --shadow-brutal-lg: 8px 8px 0px 0px #000000;
}
```
*(Hoặc theo cú pháp theme tuỳ thuộc config cụ thể của Tailwind v4)*
- [ ] **[GREEN]** Tạo giao diện cơ bản trên `page.tsx`:
```tsx
export default function Home() {
  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen">
      <div className="border-4 border-black bg-white shadow-brutal-lg p-8 rounded-xl max-w-md w-full">
        <h1 className="text-3xl font-bold uppercase mb-4">GenVoice AI</h1>
        <button className="bg-[#ffd800] border-2 border-black font-bold uppercase px-6 py-3 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
          Start Project
        </button>
      </div>
    </div>
  );
}
```
- [ ] **[GREEN]** Run test -> PASS.

---

## 9. Change Log

| Date | Version | Changed By | Change Summary |
|------|---------|------------|----------------|
| 2026-04-20 | v1.0 | Antigravity | Initial plan |
