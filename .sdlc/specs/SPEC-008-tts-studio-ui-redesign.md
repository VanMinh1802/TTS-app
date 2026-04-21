# SPEC-008: TTS Studio UI Redesign

## Overview
Redesign TTS Studio page (`/studio`) với hybrid layout từ multiple design options.

## Current State

- `/studio/page.tsx`: 397 lines, single file monolithic
- Grid 3-column (2/3 + 1/3) layout
- Multiple issues:
  - Voice selection hardcoded (3 options only)
  - Voice setting sliders chưa connected
  - Custom Dictionary hidden trong collapsible
  - Audio Preview nhỏ, không always visible
  - Export Options chưa functional

## API Contracts

### GET /api/v1/voices
Fetch available voices from backend.

**Response:**
```json
{
  "voices": [
    { "id": "vi_female", "name": "Vietnamese Female", "lang": "Vietnamese", "available": true },
    { "id": "vi_male", "name": "Vietnamese Male", "lang": "Vietnamese", "available": true }
  ]
}
```

### POST /api/v1/tts/generate
Generate audio from text.

**Request:**
```json
{
  "text": "string",
  "voice_id": "string",
  "speed": 1.0,
  "user_dictionary": [{ "word": "ABC", "pronunciation": "Công ty ABC", "priority": 5 }]
}
```

**Response:**
```json
{
  "audio_url": "string"
}
```

### Error Handling
- Fetch voices failed: Show error toast, fallback to hardcoded list
- Generate failed: Show error message in UI, enable retry

## New Design: Option 8 Hybrid Best-of-All

```
┌────────────────────────────┬───────────────────────────────┐
│ LEFT (55%)               │ RIGHT (45%)                │
│ ┌──────────────────────┐│┌───────────────────────┐ │
│ │ VOICE + SETTINGS    │││ AUDIO PREVIEW         │ │
│ │ [▼ vi_female] Speed 1 │││ ◄▶ ■■■■■□ 1:23      │ │
│ │ [⚙ Advanced]        │││ [▶] [⏮] [⏭] [🔁]    │ │
│ └──────────────────────┘│└───────────────────────┘ │
│ ┌──────────────────────┐│┌───────────────────────┐ │
│ │ TEXT INPUT (large)   │││ DICTIONARY (scroll)   │ │
│ │                      │││ ┌─────┐ ┌─────┐ ┌─────┐ │ │
│ │ Nhập văn bản cần    │││ │ ABC │ │ TTS │ │ ✕  │ │ │
│ │ chuyển đổi...        │││ └─────┘ └─────┘ └─────┘ │ │
│ │                      │││ [+ Add word]            │ │
│ └──────────────────────┘││                         │ │
│ ────────────────────────│├───────────────────────┤ │
│ [CLEAR]       [GENERATE] ││ [EXPORT: WAV ▼] [⬇] │ │
└────────────────────────────┴───────────────────────────────┘
```

## Requirements

### 1. Layout Structure
- **Split Panel**: Left (55%) + Right (45%)
- **Left Panel Components**:
  - Voice + Settings bar (fixed top)
  - Text Input (scrollable, chiếm remaining height)
  - Action buttons (fixed bottom)
- **Right Panel Components**:
  - Audio Preview (fixed top, always visible)
  - Custom Dictionary (scrollable)
  - Export section (fixed bottom)

### 2. Voice Selection
- Fetch voices từ API thay vì hardcode
- Dropdown select với available voices
- Disable unavailable voices (show "Coming Soon")
- Selected voice hiển thị selected state

### 3. Voice Settings
- Speed slider: 0.5 - 2.0, step 0.1, default 1.0
- Pitch slider: -2 to +2, default 0 (bonus: chưa connect API)
- Volume slider: 0-100%, default 100 (bonus: chưa connect API)
- Advanced toggle: show pitch/volume when expanded

### 4. Text Input
- Large textarea, min-height 250px
- Character count: `{count} / 5000`
- Clear button: reset textarea
- Placeholder text localized

### 5. Custom Dictionary
- Always visible trong right panel
- List format: `[word] → [pronunciation] [✕]`
- Add form: `[word input] [pronunciation input] [+ Add]`
- Priority selector: dropdown (1-10, default 5)

### 6. Audio Preview
- Full-width player
- Playback controls: [⏮] [▶/⏸] [⏭] [🔁]
- Progress bar với timestamps
- Waveform visualization (bonus)

### 7. Export Options
- Format dropdown: WAV (default), MP3
- Quality selector: High, Medium, Low (bonus)
- Download button
- Copy URL button

### 8. Generate Button
- Primary CTA, prominent position
- Loading state với spinner + "Generating..."
- Disabled when: no text OR generating

## Implementation Notes

- Break into smaller components:
  - `VoiceSelector.tsx`
  - `VoiceSettings.tsx`
  - `TextInput.tsx`
  - `CustomDictionary.tsx`
  - `AudioPreview.tsx`
  - `ExportPanel.tsx`
- Fetch voices từ `GET /api/v1/tts/voices` (confirmed exists in `backend/app/api/tts.py`)
- Connect speed parameter to API
- Connect dictionary to API (as user_dictionary)

## Acceptance Criteria

### Functional
- [ ] Layout: 55/45 split panel visible
- [ ] Voice: Dropdown load từ API, show available/unavailable
- [ ] Speed: Slider works, send to API
- [ ] Text: Large input, char count, clear button
- [ ] Dictionary: Visible, add/remove words works
- [ ] Audio: Player shows after generate, controls work
- [ ] Export: Download file works, format selectable
- [ ] Generate: Button works, loading state shows

### Error Handling
- [ ] Fetch voices failed: Show error toast, use fallback list
- [ ] Generate failed: Show error message, enable retry button

### Responsive
- [ ] Desktop (≥1024px): 55/45 split panel
- [ ] Tablet (768-1023px): 55/45 split panel
- [ ] Mobile (<768px): Stack vertically (Left panel → Right panel)