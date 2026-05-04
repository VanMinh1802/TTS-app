# TTS Studio UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix isTextOverLimit bug, add progress bar + auto-play, voice sample preview, persist voice/speed settings.

**Architecture:** All changes in frontend `src/app/studio/page.tsx` + related studio components. No backend changes needed. Uses localStorage for persistence, HTML5 audio API for auto-play.

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Draft

---

## Task 1: Fix `isTextOverLimit` — wire TextInput → studio page

### `src/features/studio/components/TextInput.tsx`

Add `onOverLimit` callback prop and call it when char count exceeds maxChars:

```typescript
interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onOverLimit?: (isOver: boolean) => void;  // NEW
}

export function TextInput({ value, onChange, onOverLimit }: TextInputProps) {
  const t = useT();
  const charCount = value.length;
  const maxChars = 5000;
  const isOver = charCount > maxChars;

  // Alert parent when over-limit state changes
  useEffect(() => {
    onOverLimit?.(isOver);
  }, [isOver, onOverLimit]);

  // ... rest unchanged
```

Add `import { useEffect } from 'react';` at top.

### `src/app/studio/page.tsx`

Update the `<TextInput>` usage to pass the callback:

Lines ~297 (the JSX render area):
```tsx
<TextInput value={text} onChange={handleTextChange} onOverLimit={setIsTextOverLimit} />
```

---

## Task 2: Add progress bar during generation

### `src/app/studio/page.tsx`

Add a `progress` state and update during generation:

```typescript
const [generationProgress, setGenerationProgress] = useState(0);
```

Modify `handleGenerate` to simulate progress via a timer:

```typescript
const handleGenerate = useCallback(async () => {
    if (!text.trim() || isTextOverLimit) return;
    setGenerating(true);
    setGenerationProgress(0);
    setAudioUrl(null);
    setError(null);
    setNormMeta(null);

    // Simulate progress 0→90% over ~20 seconds
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 800);

    try {
      const response = await generateTts({ ... });
      clearInterval(progressInterval);
      setGenerationProgress(100);
      handleGenerationSuccess(response.audio_url, response.duration, response.normalization);
    } catch (generateError) {
      clearInterval(progressInterval);
      handleGenerationError(generateError);
    } finally {
      setGenerating(false);
    }
  }, [...]);
```

### `src/app/studio/page.tsx` — JSX

Replace the current loading indicator with a progress bar. Near line 317 (generate button area), show a progress bar when generating:

```tsx
{generating && (
  <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
    <motion.div
      className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full"
      animate={{ width: `${generationProgress}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>
)}
```

Or better: update `AudioPreview` to accept a `progress` prop (0-100).

### `src/features/studio/components/AudioPreview.tsx`

Add `progress` prop:

```typescript
interface AudioPreviewProps {
  audioUrl: string | null;
  loading: boolean;
  progress: number; // NEW: 0-100
  onDownload: () => void;
  onCopy: () => void;
  error?: string | null;
}
```

In the loading state, show the progress:
```tsx
{loading ? (
  <motion.div key="loading" ... className="h-36 flex flex-col ...">
    <motion.div ...>{spinner}</motion.div>
    <p className="...">{t.studio.generatingAudio} {Math.round(progress)}%</p>
    <div className="w-full max-w-[200px] bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  </motion.div>
) : ...
```

Update `PreviewPanel` to pass `progress` through:
```typescript
<AudioPreview audioUrl={audioUrl} loading={loading} progress={progress} ... />
```

---

## Task 3: Auto-play after generation

### `src/app/studio/page.tsx`

Add `useRef<HTMLAudioElement>` in the page:

```typescript
const audioRef = useRef<HTMLAudioElement | null>(null);
```

In `handleGenerationSuccess`, after `setAudioUrl(nextAudioUrl)`, add auto-play:

```typescript
const handleGenerationSuccess = useCallback((nextAudioUrl: string, duration: number, normalization?: NormalizationMeta | null) => {
    setAudioUrl(nextAudioUrl);
    if (normalization) setNormMeta(normalization);
    notify({ ... });
    
    // Auto-play after a short delay (let React render the <audio> element first)
    setTimeout(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement | null;
      audio?.play().catch(() => {
        // Browsers block autoplay without user gesture — silent fail
      });
    }, 100);
    
    // ... saveLocalRecord ...
  }, [...]);
```

### `src/features/studio/components/AudioPreview.tsx`

Add `autoPlay` prop:

```typescript
interface AudioPreviewProps {
  audioUrl: string | null;
  loading: boolean;
  progress: number;
  autoPlay?: boolean; // NEW
  onDownload: () => void;
  onCopy: () => void;
  error?: string | null;
}
```

Pass `autoPlay` to the `<audio>` element:
```tsx
<audio controls className="w-full" src={audioUrl} autoPlay={autoPlay} />
```

Update `PreviewPanel` to accept and pass `autoPlay`.

---

## Task 4: Voice sample preview in VoiceSelector

### `src/features/studio/components/VoiceSelector.tsx`

The `StudioVoice` type already has `sample_url?: string | null`. Add a play button if `sample_url` exists:

```typescript
interface Voice {
  id: string;
  name: string;
  lang: string;
  available: boolean;
  sample_url?: string | null; // NEW
}
```

Add play preview button next to selected voice name:

```tsx
{selected && (
  <div className="flex items-center gap-3 mt-3">
    <p className="text-[12px] font-normal tracking-wide text-[#71717A] opacity-80">{selected.lang}</p>
    {selected.sample_url && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const audio = new Audio(selected.sample_url!);
          audio.play().catch(() => {});
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-widest text-[#A1A1AA] hover:text-white transition-colors"
        title="Nghe thử"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7-11-7z"/></svg>
        Nghe thử
      </button>
    )}
  </div>
)}
```

The `sample_url` is already in `studioVoiceSchema` (line 26 of voice-types.ts) as optional. It will display if the backend returns it.

---

## Task 5: Persist voice + speed settings in localStorage

### `src/app/studio/page.tsx`

Add storage keys and restore logic:

```typescript
const STORAGE_KEY_VOICE = "studio_voice_id";
const STORAGE_KEY_SPEED = "studio_speed";
```

### Restore on mount (add to the existing mount useEffect or create a new one):

```typescript
useEffect(() => {
  const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
  const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
  // Wait for voices to load first, then restore
  if (voices.length > 0) {
    if (savedVoice && voices.some(v => v.id === savedVoice)) {
      setSelectedVoice(savedVoice);
    }
    if (savedSpeed) {
      setSpeed(parseFloat(savedSpeed));
    }
  }
}, [voices]);
```

Wait — this depends on `voices` being loaded. Better approach: restore after voices are loaded in the existing `loadVoices` success path:

In the existing `handleSelectVoice` and `handleSpeedChange`, add localStorage writes:

```typescript
const handleSelectVoice = useCallback((nextVoiceId: string) => {
  setSelectedVoice(nextVoiceId);
  localStorage.setItem(STORAGE_KEY_VOICE, nextVoiceId);
}, []);

const handleSpeedChange = useCallback((nextSpeed: number) => {
  setSpeed(nextSpeed);
  localStorage.setItem(STORAGE_KEY_SPEED, String(nextSpeed));
}, []);
```

### Restore on voices loaded (modify existing useEffect line 52):

```typescript
setSelectedVoice((current) => {
  const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
  if (savedVoice && nextVoices.some(v => v.id === savedVoice)) return savedVoice;
  if (current && nextVoices.some(v => v.id === current)) return current;
  return nextVoices[0]?.id || "";
});
```

And restore speed:
```typescript
useEffect(() => {
  const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
  if (savedSpeed) setSpeed(parseFloat(savedSpeed));
}, []);
```

---

## Task 6: Final verification

Run: `npm run build` + `npm test`
Expected: build passes, tests pass.

---

## 3. Files Changed

| File | Change |
|------|--------|
| `src/features/studio/components/TextInput.tsx` | Add `onOverLimit` prop + `useEffect` |
| `src/features/studio/components/AudioPreview.tsx` | Add `progress` + `autoPlay` props |
| `src/features/studio/components/PreviewPanel.tsx` | Pass through `progress` + `autoPlay` props |
| `src/features/studio/components/VoiceSelector.tsx` | Add voice sample preview button |
| `src/app/studio/page.tsx` | Wire isTextOverLimit, add progress state, auto-play, voice/speed persistence |

---

## 4. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan | — | All |
