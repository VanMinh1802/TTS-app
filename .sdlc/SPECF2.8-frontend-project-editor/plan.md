# PLAN: F2.8 - Project Editor

## Architecture

```
frontend/src/app/
├── project/[id]/
│   └── page.tsx    # Project Editor
```

## Implementation

### 1. Header Bar
- Back button (link to dashboard)
- Project name (editable or static)
- Save status badge (SAVED)
- Export button
- Publish button

### 2. Script Blocks Sidebar
- Add new block button
- Draggable list of blocks
- Each block: voice name, text preview, play button

### 3. Timeline Area
- Voice tracks (V1, V2...)
- Audio/BGM tracks (A1, A2...)
- Audio clips as colored bars
- Playhead indicator

### 4. Playback Controls
- Previous, Play/Pause, Next buttons
- Time display (HH:MM:SS)

---

# Implementation Steps

- [x] 1. Create plan.md
- [ ] 2. Create `frontend/src/app/project/[id]/page.tsx`
- [ ] 3. Implement Header component
- [ ] 4. Implement Script Blocks sidebar
- [ ] 5. Implement Timeline visualization
- [ ] 6. Implement Playback controls
- [ ] 7. Add route to Navbar