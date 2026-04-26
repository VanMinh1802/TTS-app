# Implementation Plan: SPEC009 Login Page Redesign

## 1. Setup & Verification
- **Step 1**: Đảm bảo đang đứng ở nhánh đúng và thư mục frontend hợp lệ (hiện tại người dùng đã setup sẵn).
- **Step 2**: Xác nhận `frontend/src/app/login/page.tsx` tồn tại và đang sử dụng thư viện `@react-oauth/google`.

## 2. Refactor `frontend/src/app/login/page.tsx`
- **Step 1**: Xóa bỏ giao diện Light Mode Brutalism cũ (các khối thẻ trắng vàng xanh).
- **Step 2**: Đưa cấu trúc HTML từ `mockups/login-concept-a-v2.html` vào component `LoginForm`.
- **Step 3**: Thay thế thẻ `<div className="aurora-bg">` bằng các class Tailwind v4 hoặc inline styles tương đương. Hoặc định nghĩa `.aurora-bg` trực tiếp trong component thông qua style inline.
- **Step 4**: Gắn logic `login()` của Google SSO vào nút `brutal-btn-google` mới. Cập nhật trạng thái `loading` và `disabled`. Hiển thị lỗi (Error Alert) nếu có.

## 3. Polish & Accessibility (a11y)
- **Step 1**: Cập nhật lại các thuộc tính `aria-label` cho nút Đăng nhập để đảm bảo chuẩn accessibility.
- **Step 2**: Kiểm tra hiển thị responsive trên thiết bị di động (nút không bị tràn).
- **Step 3**: Kiểm tra chức năng login SSO thực tế.
