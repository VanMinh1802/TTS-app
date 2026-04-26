# SPEC010: Dashboard Redesign (Northern Aurora Dark Mode)

## 1. Overview
Nâng cấp giao diện trang Dashboard (`frontend/src/app/dashboard/page.tsx`) từ phong cách Light Mode hiện tại sang Dark Mode (chủ đề Northern Aurora) tương đồng với trang Login mới. Cấu trúc và bố cục các thành phần (Layout) được giữ nguyên theo yêu cầu của người dùng để duy trì thói quen sử dụng, nhưng trải nghiệm thị giác (UI/UX) sẽ được "lột xác" hoàn toàn theo hướng Neo-Brutalism cao cấp.

## 2. Mục tiêu (Goals)
- **Đồng bộ hóa Design System**: Áp dụng triệt để bộ màu Dark Mode (Đen sâu + Neon Glow) đã được định nghĩa.
- **Không thay đổi Layout**: Giữ nguyên vị trí của Lời chào, Bảng thống kê (Stats), Thẻ Quota (Quota Remaining), và Nút hành động nhanh (+ Open TTS Studio).
- **Tăng cường Neo-Brutalism**: Sử dụng viền dày, bóng đổ màu neon mạnh, font chữ in hoa (uppercase) và tracking chặt chẽ hơn.

## 3. Kiến trúc UI/UX (Layout Concept C)
Giao diện mới được tham chiếu từ bản mockup `mockups/dashboard-concept-c-current-dark.html`:
- **Global Background**: Nền màu Đen (`#000`) kết hợp với Aurora Glow (Cyan, Pink, Purple, Gold).
- **Typography**: 
  - Thẻ Welcome Back dùng `drop-shadow` Neon Pink.
  - Các tiêu đề nhỏ (Label) sử dụng in hoa toàn bộ và màu text `text-gray-400`.
  - Các con số thống kê phóng to `text-5xl` và dùng font `font-black`.
- **Stats Grid**:
  - Gồm 3 khối: Audio Generated, Characters Used, Days Active (đã bỏ Total Projects ở các task trước).
  - Khối Brutalism nền đen, viền trắng, đổ bóng (box-shadow) các màu Neon: Cyan (`#0df`), Pink (`#ff1493`), Gold (`#ffd800`).
- **Quota Remaining Card**:
  - Bảng thống kê tài nguyên sử dụng hiển thị các thanh Progress Bar với hiệu ứng phát sáng mờ (glow shadow) tương ứng với từng chỉ số (Cyan cho Characters, Gold cho Storage, Pink cho API).
- **Action Button**:
  - Nút `+ Open TTS Studio` được thiết kế to, đậm, nền Vàng Neon (`#ffd800`), chữ đen, viền trắng dày, đổ bóng trắng cứng, mô phỏng nút bấm vật lý công nghiệp.

## 4. Lồng ghép kỹ thuật (Technical Requirements)
- **Target File**: `frontend/src/app/dashboard/page.tsx`.
- **CSS Architecture**: 
  - Bổ sung class `.aurora-bg` vào thẻ gốc (Root Wrapper) của component hoặc inline style.
  - Cập nhật các class của `framer-motion` (TiltCard, FadeIn, StaggerItem) để phù hợp với màu viền/bóng mới mà không làm hỏng Animation.
  - Các bóng đổ Custom phải tuân thủ chuẩn Tailwind CSS v4 `shadow-[X_Y_blur_color]`.

## 5. Tiêu chí hoàn thành (Definition of Done)
- Code giao diện React của Dashboard hiển thị chính xác như `dashboard-concept-c-current-dark.html`.
- Các giá trị thống kê hiển thị rõ ràng, tương phản tốt trên nền tối.
- Không phát sinh lỗi Hydration từ Next.js Server Components.
- Các liên kết (Link) hoạt động bình thường, nút Open TTS Studio dẫn chính xác tới `/studio`.
