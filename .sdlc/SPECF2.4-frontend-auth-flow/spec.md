# SPEC: F2.4 - Authentication Flow

## Overview
Xây dựng authentication flow với Login và Register pages, kết nối với backend auth API.

---

## Functional Requirements

### Pages

#### Login Page (`/login`)
- [x] Email input
- [x] Password input
- [x] Login button
- [x] Link to Register page
- [x] Form validation

#### Register Page (`/register`)
- [x] Email input
- [x] Password input
- [x] Confirm password
- [x] Register button
- [x] Link to Login page
- [x] Form validation

### Features
- [x] Neo-Brutalism design
- [x] Loading states
- [x] Error handling
- [x] Form validation
- [x] Redirect after success

---

## Acceptance Criteria

- [x] User có thể đăng ký tài khoản
- [x] User có thể đăng nhập
- [x] Invalid credentials hiển thị lỗi
- [x] Success redirect về dashboard

---

## API Contract

```typescript
// POST /api/auth/login
{ email: string, password: string } → { token: string, user: User }

// POST /api/auth/register  
{ email: string, password: string } → { token: string, user: User }
```

---

## Dependencies

- [x] F2.3 (App Router)
- [x] F2.2 (shadcn/ui)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ