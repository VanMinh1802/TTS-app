# SPEC009: Login Page Redesign (Google SSO & Neo-Brutalism)

## 1. Overview
Thiết kế lại trang đăng nhập (Login Page) của ứng dụng TYPE2VIBE để tối ưu hoá tỷ lệ chuyển đổi và nâng cấp giao diện theo chuẩn thiết kế Neo-Brutalism kết hợp với chủ đề Dark Mode Northern Aurora. Loại bỏ hoàn toàn phương thức đăng nhập bằng Email/Password truyền thống.

## 2. Mục tiêu (Goals)
- **Tối ưu UX**: Giảm thiểu số lượng thao tác của người dùng thông qua việc chỉ sử dụng duy nhất tính năng Đăng nhập một chạm (Single Sign-On) qua Google.
- **Visual Impact**: Tạo ấn tượng mạnh mẽ cho người dùng ngay từ màn hình đầu tiên với hệ thống Design Token mới của TYPE2VIBE (Neo-Brutalism + Teal/Aurora Glow).
- **An toàn & Đơn giản**: Không cần quản lý vòng đời mật khẩu (Quên mật khẩu, đổi mật khẩu) tại Frontend.

## 3. Kiến trúc UI/UX (Layout Concept A - Centered Modal)
Trang đăng nhập sẽ được cấu trúc dựa trên file thiết kế `mockups/login-concept-a-v2.html` đã được duyệt:
- **Background (Global)**: Sử dụng hiệu ứng Northern Aurora (`radial-gradient` kết hợp Pink, Cyan, Purple) trên nền màu Đen (`#000`).
- **Main Container**: Căn giữa màn hình hoàn toàn (Centered Modal). Khối thẻ hộp (Card) sử dụng `bg-black`, viền `border-white` dày (4px), và đổ bóng `box-shadow` dày đặc trưng của phong cách Brutalism.
- **Typography & Branding**: Tên ứng dụng `TYPE2VIBE.` được phóng to (text-5xl) kết hợp với drop-shadow neon.
- **Authentication Button**: Một nút duy nhất "Continue with Google". Nút được thiết kế to, viền trắng dày, nền đen, và đổ bóng neon nổi bật. Nút này sẽ có hiệu ứng "lún" (`translate`) mô phỏng vật lý khi click chuột.

## 4. Lồng ghép kỹ thuật (Technical Requirements)
- Component trang Login mới sẽ được đặt tại `frontend/src/app/(auth)/login/page.tsx` (hoặc tuỳ chỉnh theo cấu trúc Next.js App Router hiện tại).
- Tích hợp với Auth endpoint của Backend (Supabase/Firebase hoặc Custom OAuth handler tùy thuộc cấu trúc Auth hiện tại của TYPE2VIBE).
- Tuân thủ nghiêm ngặt Tailwind CSS v4 để render chính xác màu bóng đổ RGB Custom (không dùng class cũ gây xung đột độ mờ bóng).

## 5. Rủi ro & Hạn chế
- **Trường hợp lỗi Google SSO**: Nếu Google SSO bị sập hoặc bị mạng chặn, người dùng không thể truy cập. Cần có cơ chế Toast/Alert thông báo lỗi Network nếu đăng nhập thất bại.
- **Responsive**: Khối Centered Brutalism có đổ bóng lớn có thể bị tràn trên điện thoại kích thước cực nhỏ (như iPhone SE). Cần tối ưu responsive (giảm độ dày viền và bóng đổ trên Mobile).

## 6. Tiêu chí hoàn thành (Definition of Done)
- Chuyển đổi thành công file `login-concept-a-v2.html` thành React Server Component / Client Component.
- Nút "Continue with Google" gọi đúng phương thức đăng nhập SSO của hệ thống.
- Đạt 100% điểm Accessibility (có aria-label cho các nút điều hướng tương ứng).
