# Implementation Plan: SPEC010 Dashboard Redesign

## 1. Setup
- Đứng ở nhánh hiện tại.
- Mục tiêu chính: Cập nhật `frontend/src/app/dashboard/page.tsx`.

## 2. Refactor `frontend/src/app/dashboard/page.tsx`
- **Step 1 - Global Style**: Đổi nền `main` sang `min-h-[100dvh] bg-black text-white relative` và thêm một thẻ `div` cố định phía sau cho hiệu ứng `aurora-bg`.
- **Step 2 - Typography**: Đổi tiêu đề `Welcome back, Admin` sang `text-4xl md:text-5xl font-extrabold mb-10 tracking-tight uppercase drop-shadow-[2px_2px_0_rgba(255,20,147,0.8)]`.
- **Step 3 - Stats Grid**: Cập nhật lại các màu sắc của mảng `stats` và giao diện bên trong thẻ `TiltCard`. Thay vì nền màu, sử dụng nền `bg-black`, viền `border-[#color]` và đổ bóng neon tương ứng.
- **Step 4 - Quota Card**: Cập nhật Quota Card sang viền trắng, nền đen. Bổ sung các Progress Bar phát sáng (glow shadow) dùng class Tailwind `shadow-[0_0_10px_#color]`.
- **Step 5 - Quick Action Button**: Thiết kế lại nút `Open TTS Studio` theo kiểu nút Brutalism (nền vàng `#ffd800`, chữ đen, đổ bóng trắng) và đặt nằm riêng lẻ.

## 3. Polish & Verification
- Đảm bảo các component animation (FadeIn, TiltCard, PressButton) hoạt động ổn định trên nền Dark Mode.
- Kiểm tra tính Responsive (mobile view) không bị vỡ bố cục thẻ Quota.
