# SPEC: 002 - Frontend Design System (Neo-Brutalism)

## Overview
Định hình và chuẩn hóa Hệ thống Thiết kế (Design System) cho toàn bộ ứng dụng người dùng và bảng điều khiển (Dashboard) theo trường phái **Neo-Brutalism**. Thiết kế này sẽ được áp dụng trực tiếp lên thư viện `shadcn/ui` và `Tailwind CSS` trên nền tảng Next.js 16.

---

## 1. Triết lý Thiết kế (Design Philosophy)
- Khước từ sự mượt mà truyền thống (Soft drop-shadows, delicate borders).
- Tạo ra sự táo bạo, cá tính, phá cách với độ tương phản màu sắc cực mạnh.
- Trực quan, thô ráp nhưng rành mạch (mọi thành phần UI đều hiện rõ ràng bằng đường viền đen đặc).

---

## 2. Token Hệ thống (Design Tokens)

### 2.1. Typography
- **Primary Font**: `Space Grotesk` (Sử dụng cho toàn bộ Headings, Button text, và Label các thông số nhằm tạo sự mạnh mẽ, góc cạnh mang hơi thở đương đại).
- **Body Font**: `Inter` hoặc `Space Grotesk` (Sử dụng cho paragraph để đảm bảo tính dễ đọc).

### 2.2. Color Palette (Bảng màu)
Thay vì các màu gradient chuyển sắc mượt mà ở các khối UI, hệ thống dùng màu đặc bão hòa cao (Solid) kết hợp với phông nền Radial Gradient ngọc lam mát mẻ:

- **Nền chính Light Mode (Global Background)**: Để làm dịu đi độ cứng của Brutalism, toàn bộ nền Light mode ứng dụng sẽ sử dụng `bg-white` kết hợp vệt sáng phát quang (Radial Gradients Teal):
  ```css
  background-color: #ffffff;
  background-image: 
    radial-gradient(circle 600px at 0% 200px, #a7f3d0, transparent),
    radial-gradient(circle 600px at 100% 200px, #a7f3d0, transparent);
  ```
- **Nền chính Dark Mode (Global Background - Northern Aurora)**: Dark mode sử dụng Nền đen sâu điểm xuyết các vùng cực quang (Pink, Cyan, Purple, Gold) mượt mà huyền ảo:
  ```css
  background-color: #000000;
  background-image: 
    radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
    radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
    radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
    radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%);
  ```
- **Nền phụ (Surface/Cards)**: Trong Light Mode dùng Trắng Sữa (`#ffffff`), Vàng (`#ffd800`). Trong Dark Mode, dùng `bg-black` hoặc `bg-zinc-950` để kết hợp với viền Brutalism phát sáng.
- **Nền phụ (Surface)**: Xanh Cyan nhạt (`#e0f7fa`) hoặc Tím Pastel (`#f3e8ff`).
- **Nét viền & Text chính**: Đen nguyên bản (`#000000`).
- **Màu nhấn cảnh báo/Action chính (Accent)**: Đỏ thuần (`#ff4d4d`), Xanh Neon (`#00e676`).

### 2.3. Borders & Shadows (Thành phần cốt lõi)
Thay thế chuẩn của shadcn/ui:
- **Borders**: Thay vì `border-1 border-gray-200`, mọi components (Card, Button, Input) đều dùng `border-2`, `border-3`, hoặc `border-4` với màu `#000000`.
- **Shadows**: Hard-shadow (không làm mờ).
  - Component tĩnh (Card): `box-shadow: 8px 8px 0px #000`.
  - Component động (Button): `box-shadow: 4px 4px 0px #000`.

---

## 3. Kiến trúc Component (Tùy biến shadcn/ui)

Khi cài đặt `shadcn/ui`, chúng ta sẽ đè (override) cấu hình CSS Variables trong `globals.css` và `tailwind.config.ts`:

### Button
- Trạng thái bình thường: Nền sáng (vd Đỏ), Viền đen dày `3px`, Box Shadow `4px 4px 0px #000`.
- Trạng thái `:active` (hoặc Click): Box shadow giảm về `0px`, Nút dịch chuyển `translate-x-1 translate-y-1` để tạo cảm giác bấm vật lý "lún" xuống rất sướng tay.

### Card
- Bo góc vuông hoặc tròn nhẹ (`rounded-none` hoặc `rounded-xl`).
- Áp dụng viền đen dày và bóng đen `8px` hoặc `12px` lệch về góc phải-dưới.

### Inputs / Form Controls
- Nền trắng, viền đen dày, khi focus sẽ làm đậm độ dày viền thay vì phát sáng mờ.

---

## 4. Lộ trình Triển khai Kỹ thuật (Implementation Plan)

- **F2.1**: Khởi tạo Next.js App Router (sử dụng Tailwind v4 mới nhất theo dự án).
- **F2.2**: Cấu hình `globals.css` và Custom Theme trong Tailwind để hỗ trợ các class như `shadow-brutal` hay `border-brutal`.
- **F2.3**: Import Font `Space Grotesk` từ `next/font/google`.
- **F2.4**: Cập nhật file `.sdlc` (SPEC) hiện tại để đội Engineer tiến hành thi công các mockups gốc sang dạng Component React.

---

## 5. Rủi ro & Giải pháp rào cản
- **Trải nghiệm quá "gắt"**: Neo-brutalism thu hút sự chú ý cực mạnh, có thể gây mỏi mắt nếu lạm dụng trên màn hình đọc nhiều chữ.
- **Giải pháp**: Sử dụng mã nền Global Light Mode (Nền trắng tinh khiết kết hợp vệt Radial Gradient ánh Teal `#a7f3d0` ở hai góc) thay vì các nền Neon bao trùm gây chói mắt. Đặc tính Neo-Brutalism (shadow + border 4px đen đặc) sẽ CHỈ áp dụng lên các Element nổi bồng bềnh trên bức nền Teal nhẹ nhàng đó, tạo sự cân bằng tuyệt vời.

---

# 👉 Vui lòng Review SPEC

Bản nháp định cấu hình giao diện (Design System) đã sẵn sàng:
- Lựa chọn: ✅ NẾU DUYỆT (Approve) bạn hãy cho ý kiến, tôi sẽ tiến hành chuyển sang **Plan Phase** theo quy trình.
- Lựa chọn: ❌ NẾU MUỐN THAY ĐỔI, xin hãy nêu rõ chi tiết bạn muốn tinh chỉnh ở điểm nào.
