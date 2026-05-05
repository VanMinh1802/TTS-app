# Feature: Dashboard Incremental Polish

> **Status:** Review
> **Author:** Kilo
> **Date:** 2026-05-05

---

## 1. Problem Statement

Current Dashboard has good layout but lacks polish: stats numbers appear instantly, progress bars are static, history is a dense table, loading shows "...", and transitions are abrupt. The page feels functional but not premium.

## 2. User Stories

### Story 1: Animated Stats Cards

**As a** user, **I want** to see stats numbers animate from 0 to their value when I load the dashboard, **so that** the page feels alive and professional.

- **Given** I open Dashboard, **When** quota data loads, **Then** each stat counter rolls up from 0 to its final value (~1.5s) with a glow pulse at completion.

### Story 2: Skeleton Loading

**As a** user, **I want** to see placeholder skeletons while data loads, **so that** I know the page is working and what the layout will look like.

- **Given** I open Dashboard, **When** data is loading, **Then** shimmer skeleton cards matching the final layout appear instead of "..." text.

### Story 3: Progress Bar with Tooltip

**As a** user, **I want** to hover over progress bars to see exact usage numbers, **so that** I know precisely how much quota I've consumed.

- **Given** I am on Dashboard, **When** I hover over a progress bar, **Then** a tooltip shows "Đã dùng X / Y (Z%)" for that resource.

### Story 4: Daily Usage Chart

**As a** user, **I want** to see a 7-day bar chart of my activity, **so that** I can track trends without reading a dense table.

- **Given** I am on Dashboard, **When** history data loads, **Then** a bar chart shows the last 7 days of activity with character usage per day.

### Story 5: Quick Stats Strip

**As a** user, **I want** a compact daily summary below the welcome header, **so that** I can see today's usage at a glance.

- **Given** I open Dashboard, **When** data loads, **Then** a mini strip shows "Hôm nay: N lượt tạo | X ký tự | Y MB lưu trữ".

## 3. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Welcome section thu gọn: tên user + tier badge, greeting theo giờ | Must |
| FR-2 | Stats cards: counter animate 0→value (1.5s easeOut) + glow pulse khi đạt | Must |
| FR-3 | Progress bars: keep layout, add fill animation + glow pulse + hover tooltip | Must |
| FR-4 | History: replace table with 7-day bar chart | Must |
| FR-5 | Skeleton shimmer loading thay "..." text | Must |
| FR-6 | Quick-stats mini strip dưới welcome | Must |
| FR-7 | Stagger entrance animation cho các section | Must |
| FR-8 | TiltCard hover elevation giữ lại | Must |
| FR-9 | Empty state đẹp cho history không có data | Should |

## 4. Implementation Scope

**File to modify:** `frontend/src/app/dashboard/page.tsx`

**New components (inline in dashboard):**
- `SkeletonCard` — shimmer placeholder matching stats layout
- `CounterText` — animated number from 0 to value
- `DailyBarChart` — 7-bar chart inline
- `QuickStatsStrip` — compact today summary

## 5. Out of Scope

- Backend API changes
- Widget drag-drop
- Light/dark mode changes
- Layout overhaul

## 6. Change Log

| Date | Version | Changed By | Change Summary |
|------|---------|------------|----------------|
| 2026-05-05 | v1.0 | Kilo | Initial spec |
