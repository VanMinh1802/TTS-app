# UI Review Checklist

## 📋 Cách Sử Dụng

1. **Chạy Review**: Dùng subagent `explore` với prompt bên dưới
2. **Input**: Đường dẫn file HTML mockup
3. **Output**: Báo cáo review theo format chuẩn

---

## Checklist Chi Tiết

### ✅ 1. Layout & Structure (8 điểm)

- [ ] **Container**: Sử dụng max-width container phù hợp (max-w-7xl cho dashboard, max-w-md cho auth)
- [ ] **Grid/Flex**: Sử dụng CSS Grid hoặc Flexbox đúng cách
- [ ] **Responsive**: Có breakpoint classes (md:, lg:, etc.)
- [ ] **Spacing**: Padding/margin nhất quán (sử dụng tailwind scale: 4, 6, 8)
- [ ] **Hierarchy**: Thứ tự thông tin rõ ràng (logo → nav → content)
- [ ] **Sidebar**: Dashboard nên có sidebar navigation
- [ ] **Mobile**: Menu hamburger cho mobile

### ✅ 2. Visual Design (8 điểm)

- [ ] **Color Scheme**: Nhất quán, có primary/secondary/accent colors
- [ ] **Dark/Light Mode**: Phù hợp với use case
- [ ] **Typography**: Font sizes theo hierarchy (text-sm → text-lg → text-xl → text-2xl)
- [ ] **Contrast**: Text contrast đủ (white/gray-300 trên dark bg)
- [ ] **Visual Interest**: Có shadows, borders, hoặc gradients
- [ ] **Brand Identity**: Logo và tên brand nhất quán

### ✅ 3. Components (8 điểm)

- [ ] **Buttons**: Primary/secondary/ghost styles
- [ ] **Forms**: Input fields với labels, placeholders, validation states
- [ ] **Cards**: Content containers với padding nhất quán
- [ ] **Navigation**: Active state, hover state rõ ràng
- [ ] **Progress/Loading**: Progress bars, skeletons cho loading
- [ ] **Badges**: Status badges (active/completed/etc.)
- [ ] **Icons**: Icons cho navigation và actions (nếu cần)

### ✅ 4. UX/Interaction (8 điểm)

- [ ] **CTA**: Call-to-action buttons rõ ràng
- [ ] **Hover States**: Interactive elements có hover feedback
- [ ] **Focus States**: Keyboard navigation support
- [ ] **Feedback**: Toast notifications, success/error messages
- [ ] **Animations**: Page load animations (fade-in, slide)
- [ ] **Empty States**: Design cho trường hợp không có dữ liệu

### ✅ 5. Accessibility (8 điểm)

- [ ] **Semantic HTML**: Sử dụng header, main, nav, footer
- [ ] **ARIA Labels**: aria-label cho buttons/links không có text
- [ ] **ARIA Roles**: role="progressbar" cho progress elements
- [ ] **Focus Visible**: Visible focus indicators
- [ ] **Color Not Only**: Không dùng màu làm indicator duy nhất
- [ ] **Lang**: lang="vi" hoặc lang="en"

---

## Scoring

| Điểm | Rating | Status |
|-------|--------|--------|
| 8/8 | ⭐⭐⭐⭐⭐ | Excellent |
| 6-7/8 | ⭐⭐⭐⭐ | Good |
| 4-5/8 | ⭐⭐⭐ | Acceptable |
| <4/8 | ⭐⭐ | Need Improvement |

---

## Prompt Template cho Agent

```markdown
Bạn là UI/UX Expert. Hãy review file mockup sau:
- File: [ĐƯỜNG DẪN FILE HTML]
- Page type: [LOGIN/REGISTER/TTS-GENERATOR/DASHBOARD]

Đọc file HTML và đánh giá theo checklist sau:

## 1. Layout & Structure (8 điểm)
Đánh giá: Container, Grid/Flex, Responsive, Spacing, Hierarchy, Sidebar, Mobile

## 2. Visual Design (8 điểm)  
Đánh giá: Color scheme, Typography, Contrast, Visual interest

## 3. Components (8 điểm)
Đánh giá: Buttons, Forms, Cards, Navigation, Progress, Badges

## 4. UX/Interaction (8 điểm)
Đánh giá: CTA, Hover/Focus states, Feedback, Animations, Empty states

## 5. Accessibility (8 điểm)
Đánh giá: Semantic HTML, ARIA, Focus states, Color independence

## Overall Score: X/10
## Status: ✅ Approve / ❌ Need Changes

Đưa ra recommendations cụ thể.
```

---

## Ví Dụ Output

```
# UI Review Report - Dashboard

| Criteria | Score |
|----------|-------|
| Layout & Structure | 6/8 |
| Visual Design | 7/8 |
| Components | 5/8 |
| UX/Interaction | 5/8 |
| Accessibility | 4/8 |

**Total: 5.4/10 - Need Changes**

### Recommendations:
1. [HIGH] Thêm ARIA labels cho navigation
2. [HIGH] Thêm focus states cho keyboard nav
3. [MEDIUM] Thêm sidebar cho dashboard
4. [MEDIUM] Thêm icons cho stats cards
```

---

## Tự Động Hóa

Để chạy review tự động:

```bash
# Mở mockup trong browser
playwright-cli open mockups/dashboard.html

# Chụp screenshot
playwright-cli screenshot --filename=dashboard.png

# Dùng agent review code
task --subagent_type=explore --prompt="Review UI..."
```