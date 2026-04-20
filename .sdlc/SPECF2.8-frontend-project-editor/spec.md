# SPEC: F2.8 - Project Editor

## Overview
Xây dựng Project Editor page cho phép user tạo và chỉnh sửa các dự án TTS với nhiều script blocks, timeline visualization, và audio mixing.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Project Name                        EXPORT | PUBLISH   │
├──────────────┬──────────────────────────────────────────────┤
│ Script Blocks│                                              │
│ ┌──────────┐ │              Timeline Area                   │
│ │ #1 Voice │ │  ┌────────────────────────────────────────┐ │
│ │ Text...  │ │  │ V1 │ [Block 1]    [Block 2]          │ │
│ └──────────┘ │  │ A1 │ [BGM Track]                      │ │
│ ┌──────────┐ │  └────────────────────────────────────────┘ │
│ │ #2 Voice │ │                                              │
│ │ Text...  │ │  [⏮] [▶] [⏭]  00:01:24                     │
│ └──────────┘ │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

---

## Functional Requirements

### Header Bar
- [ ] Back button
- [ ] Project name (editable)
- [ ] Save status indicator (SAVED)
- [ ] Export button
- [ ] Publish button

### Sidebar - Script Blocks
- [ ] Add new block button
- [ ] Draggable block list
- [ ] Block preview (voice name + text snippet)
- [ ] Play button per block
- [ ] Block options menu

### Main Area - Timeline
- [ ] Voice track (V1, V2...)
- [ ] Audio/BGM track (A1, A2...)
- [ ] Audio clips visualization
- [ ] Playhead indicator
- [ ] Zoom controls

### Playback Controls
- [ ] Previous button
- [ ] Play/Pause button
- [ ] Next button
- [ ] Time display (HH:MM:SS)

---

## Acceptance Criteria

- [ ] User có thể thêm/sắp xếp script blocks
- [ ] Timeline hiển thị audio clips đúng vị trí
- [ ] Playback controls hoạt động
- [ ] Export và Publish buttons có action
- [ ] Neo-Brutalism design nhất quán

---

## Dependencies

- [x] F2.2 (Neo-Brutalism Design)
- [x] F2.3 (App Router)

---

# 👉 APPROVE to proceed with implementation?

- ✅ **APPROVE** - Implement this feature
- ❌ **REJECT** - Request changes
- ❓ **QUESTIONS** - Ask for clarification