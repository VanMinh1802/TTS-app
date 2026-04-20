# SPEC: F2.3 - App Router Structure

## Overview
Thiết lập Next.js 16 App Router với các routes cần thiết cho TTS application.

---

## Functional Requirements

### Routes
| Path | Page | Auth Required |
|------|------|--------------|
| `/` | Landing | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/dashboard` | Dashboard | Yes |
| `/studio` | TTS Studio | Yes |
| `/voices` | Voice Library | Yes |
| `/api-keys` | API Keys | Yes |
| `/settings` | Settings | Yes |
| `/404` | Not Found | No |

### Layout
- [x] **Root Layout**: Navbar + children
- [x] **Navbar**: Logo, Navigation links, User menu
- [x] **Auth Pages**: No navbar (or minimal)

---

## Acceptance Criteria

- [x] Tất cả routes hoạt động
- [x] Auth middleware bảo vệ routes cần auth
- [x] 404 page hiển thị cho invalid routes
- [x] Responsive navigation

---

## Dependencies

- [x] F2.1 (Next.js 16 Setup)
- [x] F2.2 (shadcn/ui)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ