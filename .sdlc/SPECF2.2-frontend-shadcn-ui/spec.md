# SPEC: F2.2 - Neo-Brutalism Design System

## Overview
Thiết lập Neo-Brutalism design system với bold borders, solid shadows, và high-contrast colors, sử dụng Tailwind CSS và custom components.

---

## Functional Requirements

### Core Features
- [x] **Neo-Brutalism Base Styles**: Bold borders (3px black), solid shadows
- [x] **Color Palette**: 
  - Primary: `#00e676` (green)
  - Secondary: `#ffd800` (yellow)
  - Accent: `#ff4d4d` (red)
  - Background: `#ffffff`, `#f5f5f5`
- [x] **Typography**: Bold, uppercase headings
- [x] **Components**: BrutalCard, BrutalButton, BrutalInput
- [x] **Animations**: Framer Motion integration

### Design Tokens
| Token | Value |
|-------|-------|
| border-width | 3px |
| border-color | #000000 |
| shadow | 4px 4px 0 #000 |
| radius | 12px-24px |

---

## Acceptance Criteria

- [x] Components có bold 3px border + solid shadow
- [x] Hover states có visual feedback
- [x] Active states có press effect
- [x] Consistent spacing

---

## Dependencies

- [x] F2.1 (Next.js 16 Setup)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ