# SPEC: F2.1 - Next.js 16 Setup

## Overview
Thiết lập Next.js 16 làm framework cho frontend, cấu hình TypeScript, Tailwind CSS, và các công cụ development.

---

## Functional Requirements

### Core Features
- [x] **Next.js 16**: Framework với App Router
- [x] **TypeScript**: Type safety cho toàn bộ codebase
- [x] **Tailwind CSS v4**: Utility-first CSS framework
- [x] **ESLint + Prettier**: Code quality tools
- [x] **Development Scripts**: dev, build, start, lint

### Tech Stack
| Package | Version |
|---------|---------|
| next | 16.2.4 |
| react | 19.2.4 |
| typescript | 5 |
| tailwindcss | 4 |

---

## Acceptance Criteria

- [x] `npm run dev` khởi động dev server
- [x] `npm run build` build thành công
- [x] TypeScript check không lỗi
- [x] ESLint pass

---

## Dependencies

- [ ] F2.2 (shadcn/ui) - phụ thuộc vào Next.js setup

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ