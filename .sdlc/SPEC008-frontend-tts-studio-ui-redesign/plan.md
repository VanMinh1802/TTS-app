# TTS Studio UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/studio` page với hybrid 55/45 split panel layout, connected voice selection to API, và improved UX.

**Architecture:** 
- Chia `studio/page.tsx` (397 lines) thành 6 smaller components trong `components/studio/`
- Left panel (55%): Voice settings + Text Input + Actions
- Right panel (45%): Audio Preview + Dictionary + Export
- Fetch voices từ `GET /api/v1/tts/voices`, generate qua `POST /api/v1/tts/generate`

**Tech Stack:** Next.js 16, Tailwind CSS, Framer Motion, TypeScript

---

## File Structure

```
frontend/src/components/studio/
├── VoiceSelector.tsx    # Dropdown voice selection
├── VoiceSettings.tsx     # Speed/Pitch/Volume sliders
├── TextInput.tsx         # Large textarea với char count
├── CustomDictionary.tsx  # Add/remove word entries
├── AudioPreview.tsx      # Audio player controls
├── ExportPanel.tsx       # Format + download
└── index.ts             # Barrel export

frontend/src/app/studio/
└── page.tsx             # Main page (refactor)
```

---

## Pre-requisites

- [ ] Backend API `/api/v1/tts/voices` exists (verified in `backend/app/api/tts.py:45`)
- [ ] Backend API `/api/v1/tts/generate` exists

---

## Task 0: Setup Component Directory

**Files:** Create `frontend/src/components/studio/`

```bash
mkdir -p frontend/src/components/studio
```

---

## Task 1: Create VoiceSelector Component

**Files:** `frontend/src/components/studio/VoiceSelector.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/components/studio/VoiceSelector.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceSelector } from './VoiceSelector';

const mockVoices = [
  { id: 'vi_female', name: 'Vietnamese Female', lang: 'Vietnamese', available: true },
  { id: 'vi_male', name: 'Vietnamese Male', lang: 'Vietnamese', available: false },
];

test('renders voice options', () => {
  render(<VoiceSelector voices={mockVoices} selectedVoice="vi_female" onSelect={() => {}} />);
  expect(screen.getByText('Vietnamese Female')).toBeInTheDocument();
  expect(screen.getByText('Coming Soon')).toBeInTheDocument(); // unavailable
});

test('calls onSelect when voice clicked', async () => {
  const onSelect = jest.fn();
  render(<VoiceSelector voices={mockVoices} selectedVoice="vi_female" onSelect={onSelect} />);
  await userEvent.click(screen.getByText('Vietnamese Female'));
  expect(onSelect).toHaveBeenCalledWith('vi_female');
});
```

**[GREEN]** Write implementation:

```typescript
// frontend/src/components/studio/VoiceSelector.tsx
'use client';

import { motion } from 'framer-motion';

interface Voice {
  id: string;
  name: string;
  lang: string;
  available: boolean;
}

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
}

export function VoiceSelector({ voices, selectedVoice, onSelect }: VoiceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block font-bold mb-2">Voice</label>
      <div className="space-y-2">
        {voices.map((voice) => (
          <motion.button
            key={voice.id}
            whileHover={voice.available ? { scale: 1.01 } : {}}
            whileTap={voice.available ? { scale: 0.99 } : {}}
            onClick={() => voice.available && onSelect(voice.id)}
            disabled={!voice.available}
            className={`w-full p-3 border-3 border-black rounded-xl font-medium text-left ${
              !voice.available
                ? "bg-gray-200 opacity-60 cursor-not-allowed"
                : selectedVoice === voice.id
                  ? "bg-[#ffd800] shadow-[4px_4px_0_#000]"
                  : "bg-white hover:bg-gray-50"
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              {voice.name}
              {!voice.available && (
                <span className="bg-[#ff4d4d] text-white text-xs px-2 py-0.5 rounded font-bold">COMING SOON</span>
              )}
            </div>
            <div className="text-sm text-gray-600">{voice.lang}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 2: Create VoiceSettings Component

**Files:** `frontend/src/components/studio/VoiceSettings.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/components/studio/VoiceSettings.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceSettings } from './VoiceSettings';

test('renders speed slider', () => {
  render(<VoiceSettings speed={1} onSpeedChange={() => {}} />);
  const slider = screen.getByRole('slider');
  expect(slider).toHaveValue('1');
});

test('calls onSpeedChange when slider moves', async () => {
  const onSpeedChange = jest.fn();
  render(<VoiceSettings speed={1} onSpeedChange={onSpeedChange} />);
  const slider = screen.getByRole('slider');
  await userEvent.type(slider, '1.5');
  expect(onSpeedChange).toHaveBeenCalled();
});
```

**[GREEN]** Write implementation:

```typescript
// frontend/src/components/studio/VoiceSettings.tsx
'use client';

interface VoiceSettingsProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  pitch?: number;
  onPitchChange?: (pitch: number) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  showAdvanced?: boolean;
}

export function VoiceSettings({
  speed,
  onSpeedChange,
  pitch = 0,
  onPitchChange,
  volume = 100,
  onVolumeChange,
  showAdvanced = false,
}: VoiceSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block font-bold mb-2">Speed: {speed}x</label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-[#ffd800]"
          role="slider"
        />
        <div className="flex justify-between text-sm font-bold text-gray-500">
          <span>0.5x</span>
          <span>1x</span>
          <span>2x</span>
        </div>
      </div>

      {showAdvanced && (
        <>
          <div>
            <label className="block font-bold mb-2">Pitch: {pitch > 0 ? `+${pitch}` : pitch}</label>
            <input 
              type="range" 
              min="-2" 
              max="2" 
              step="0.5"
              value={pitch}
              onChange={(e) => onPitchChange?.(parseFloat(e.target.value))}
              className="w-full accent-[#ffd800]"
            />
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>Low</span>
              <span>Normal</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2">Volume: {volume}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={volume}
              onChange={(e) => onVolumeChange?.(parseInt(e.target.value))}
              className="w-full accent-[#ffd800]"
            />
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Task 3: Create TextInput Component

**Files:** `frontend/src/components/studio/TextInput.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/components/studio/TextInput.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';

test('renders textarea with placeholder', () => {
  render(<TextInput value="" onChange={() => {}} />);
  expect(screen.getByPlaceholderText('Nhập văn bản cần chuyển đổi...')).toBeInTheDocument();
});

test('shows character count', () => {
  render(<TextInput value="Hello" onChange={() => {}} />);
  expect(screen.getByText('5 / 5000')).toBeInTheDocument();
});

test('calls onChange when text typed', async () => {
  const onChange = jest.fn();
  render(<TextInput value="" onChange={onChange} />);
  await userEvent.type(screen.getByRole('textbox'), 'Hello');
  expect(onChange).toHaveBeenCalledWith('Hello');
});
```

**[GREEN]** Write implementation:

```typescript
// frontend/src/components/studio/TextInput.tsx
'use client';

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function TextInput({ value, onChange }: TextInputProps) {
  const charCount = value.length;
  const maxChars = 5000;

  return (
    <div className="flex flex-col h-full">
      <label className="block font-bold mb-2">Text Input</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full flex-1 min-h-[250px] p-4 border-3 border-black rounded-xl font-medium resize-none focus:outline-none focus:ring-0"
        placeholder="Nhập văn bản cần chuyển đổi..."
        role="textbox"
      />
      <div className="flex justify-between mt-2">
        <span className={`text-sm font-bold ${charCount > maxChars ? 'text-red-500' : 'text-gray-500'}`}>
          {charCount} / {maxChars} ký tự
        </span>
        <button 
          type="button"
          onClick={() => onChange('')}
          className="font-bold underline text-sm hover:text-[#ff4d4d]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

---

## Task 4: Create CustomDictionary Component

**Files:** `frontend/src/components/studio/CustomDictionary.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/components/studio/CustomDictionary.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomDictionary } from './CustomDictionary';

const mockDictionary = [
  { word: 'ABC', pronunciation: 'Công ty ABC', priority: 10 },
];

test('renders dictionary entries', () => {
  render(
    <CustomDictionary 
      dictionary={mockDictionary} 
      onAdd={() => {}} 
      onRemove={() => {}} 
    />
  );
  expect(screen.getByText('ABC')).toBeInTheDocument();
  expect(screen.getByText('Công ty ABC')).toBeInTheDocument();
});

test('calls onAdd when adding word', async () => {
  const onAdd = jest.fn();
  render(
    <CustomDictionary 
      dictionary={[]} 
      onAdd={onAdd} 
      onRemove={() => {}} 
    />
  );
  await userEvent.type(screen.getByPlaceholderText('Từ cần thay thế...'), 'TTS');
  await userEvent.type(screen.getByPlaceholderText('Cách đọc mới...'), 'Text to Speech');
  await userEvent.click(screen.getByRole('button', { name: '+' }));
  expect(onAdd).toHaveBeenCalledWith({ word: 'TTS', pronunciation: 'Text to Speech', priority: 5 });
});
```

**[GREEN]** Write implementation:

```typescript
// frontend/src/components/studio/CustomDictionary.tsx
'use client';

import { useState } from 'react';

export interface DictionaryEntry {
  word: string;
  pronunciation: string;
  priority: number;
}

interface CustomDictionaryProps {
  dictionary: DictionaryEntry[];
  onAdd: (entry: DictionaryEntry) => void;
  onRemove: (index: number) => void;
}

export function CustomDictionary({ dictionary, onAdd, onRemove }: CustomDictionaryProps) {
  const [newWord, setNewWord] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');
  const [newPriority, setNewPriority] = useState(5);

  const handleAdd = () => {
    if (!newWord.trim() || !newPronunciation.trim()) return;
    onAdd({ word: newWord, pronunciation: newPronunciation, priority: newPriority });
    setNewWord('');
    setNewPronunciation('');
    setNewPriority(5);
  };

  return (
    <div className="flex flex-col h-full">
      <label className="block font-bold mb-2">Custom Dictionary ({dictionary.length})</label>
      
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Từ cần thay thế..."
            className="flex-1 p-2 border-2 border-black rounded-lg text-sm"
          />
          <input
            type="text"
            value={newPronunciation}
            onChange={(e) => setNewPronunciation(e.target.value)}
            placeholder="Cách đọc mới..."
            className="flex-1 p-2 border-2 border-black rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="bg-[#00e676] border-2 border-black px-3 py-2 rounded-lg font-bold"
          >
            +
          </button>
        </div>
        
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(parseInt(e.target.value))}
          className="p-1 border-2 border-black rounded-lg text-sm"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
            <option key={p} value={p}>Priority: {p}</option>
          ))}
        </select>
      </div>

      {dictionary.length > 0 ? (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {dictionary.map((entry, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded border-2 border-black">
              <div className="flex-1">
                <span className="font-bold">{entry.word}</span>
                <span className="mx-2">→</span>
                <span className="text-[#ff4d4d]">{entry.pronunciation}</span>
                <span className="ml-2 text-xs text-gray-500">(p:{entry.priority})</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-[#ff4d4d] font-bold ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">No custom words added.</div>
      )}
      
      <p className="text-xs text-gray-500 font-bold mt-2">
        ✓ Từ điển được áp dụng TRƯỚC khi backend xử lý
      </p>
    </div>
  );
}
```

---

## Task 5: Create AudioPreview Component

**Files:** `frontend/src/components/studio/AudioPreview.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/components/studio/AudioPreview.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioPreview } from './AudioPreview';

test('shows loading state', () => {
  render(<AudioPreview audioUrl={null} loading={true} onDownload={() => {}} onCopy={() => {}} />);
  expect(screen.getByText('Generating audio...')).toBeInTheDocument();
});

test('shows player when audio ready', () => {
  render(<AudioPreview audioUrl="http://test.com/audio.wav" loading={false} onDownload={() => {}} onCopy={() => {}} />);
  expect(screen.getByRole('slider')).toBeInTheDocument(); // audio element
});
```

**[GREEN]** Write implementation:

```typescript
// frontend/src/components/studio/AudioPreview.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AudioPreviewProps {
  audioUrl: string | null;
  loading: boolean;
  onDownload: () => void;
  onCopy: () => void;
  error?: string | null;
}

export function AudioPreview({ audioUrl, loading, onDownload, onCopy, error }: AudioPreviewProps) {
  return (
    <div className="flex flex-col h-full">
      <label className="block font-bold mb-2">Audio Preview</label>
      
      {error && (
        <div className="mb-4 p-3 bg-[#ff4d4d] text-white border-2 border-black rounded-lg font-bold">
          Error: {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-32 flex items-center justify-center border-3 border-dashed border-black rounded-xl"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-4xl mb-2"
              >
                🔊
              </motion.div>
              <p className="font-bold">Generating audio...</p>
            </div>
          </motion.div>
        ) : audioUrl ? (
          <motion.div
            key="audio"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <audio
              controls
              className="w-full"
              src={audioUrl}
            />
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={onDownload}
                className="brut-btn bg-white px-4 py-2 border-2 border-black rounded-lg font-bold"
              >
                ⬇️ Download
              </button>
              <button
                type="button"
                onClick={onCopy}
                className="brut-btn bg-white px-4 py-2 border-2 border-black rounded-lg font-bold"
              >
                📋 Copy
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-32 flex items-center justify-center border-3 border-dashed border-black rounded-xl"
          >
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-2">🎵</div>
              <p className="font-bold">No audio yet</p>
              <p className="text-sm">Enter text and click Generate</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Task 6: Create ExportPanel Component

**Files:** `frontend/src/components/studio/ExportPanel.tsx`

---

**[RED]** Write failing test:

```typescript
// frontend/src/components/studio/ExportPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportPanel } from './ExportPanel';

test('renders format options', () => {
  render(<ExportPanel format="wav" onFormatChange={() => {}} onExport={() => {}} />);
  expect(screen.getByText('WAV')).toBeInTheDocument();
  expect(screen.getByText('MP3')).toBeInTheDocument();
});
```

**[GREEN]** Write implementation:

```typescript
// frontend/src/components/studio/ExportPanel.tsx
'use client';

interface ExportPanelProps {
  format: 'wav' | 'mp3';
  onFormatChange: (format: 'wav' | 'mp3') => void;
  onExport: () => void;
}

export function ExportPanel({ format, onFormatChange, onExport }: ExportPanelProps) {
  return (
    <div className="space-y-3">
      <label className="block font-bold">Export Format</label>
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => onFormatChange('wav')}
          className={`flex-1 py-2 border-2 border-black rounded-lg font-bold ${
            format === 'wav' ? 'bg-[#ffd800] shadow-[2px_2px_0_#000]' : 'bg-white'
          }`}
        >
          WAV
        </button>
        <button
          type="button"
          onClick={() => onFormatChange('mp3')}
          className={`flex-1 py-2 border-2 border-black rounded-lg font-bold ${
            format === 'mp3' ? 'bg-[#ffd800] shadow-[2px_2px_0_#000]' : 'bg-white'
          }`}
        >
          MP3
        </button>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="w-full brut-btn bg-[#00e676] py-3 font-bold"
      >
        Export File
      </button>
    </div>
  );
}
```

---

## Task 7: Create Barrel Export

**Files:** `frontend/src/components/studio/index.ts`

---

```typescript
// frontend/src/components/studio/index.ts
export { VoiceSelector } from './VoiceSelector';
export { VoiceSettings } from './VoiceSettings';
export { TextInput } from './TextInput';
export { CustomDictionary, type DictionaryEntry } from './CustomDictionary';
export { AudioPreview } from './AudioPreview';
export { ExportPanel } from './ExportPanel';
```

---

## Task 8: Refactor Studio Page to Use Components

**Files:** `frontend/src/app/studio/page.tsx`

---

Thay thế nội dung 397 lines bằng layout mới:

```typescript
// frontend/src/app/studio/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import {
  VoiceSelector,
  VoiceSettings,
  TextInput,
  CustomDictionary,
  AudioPreview,
  ExportPanel,
  type DictionaryEntry,
} from "@/components/studio";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Voice {
  id: string;
  name: string;
  lang: string;
  available: boolean;
}

export default function StudioPage() {
  // Voice state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("vi_female");
  const [loadingVoices, setLoadingVoices] = useState(true);

  // Settings state
  const [speed, setSpeed] = useState(1);

  // Text state
  const [text, setText] = useState("Xin chào các bạn! Hôm nay chúng ta sẽ cùng nhau khám phá công nghệ TTS tuyệt vời.");

  // Dictionary state
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([
    { word: "ABC corp", pronunciation: "Công ty ABC", priority: 10 },
  ]);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Export state
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('wav');

  // Fetch voices on mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch(`${API_URL}/tts/voices`);
        const data = await res.json();
        setVoices(data.voices || []);
      } catch {
        // Fallback to hardcoded
        setVoices([
          { id: "vi_female", name: "Vietnamese Female", lang: "Vietnamese", available: true },
          { id: "vi_male", name: "Vietnamese Male", lang: "Vietnamese", available: true },
        ]);
      } finally {
        setLoadingVoices(false);
      }
    };
    fetchVoices();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;

    setGenerating(true);
    setAudioUrl(null);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/tts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice,
          speed,
          user_dictionary: dictionary.length > 0 ? dictionary : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const data = await response.json();
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }, [text, selectedVoice, speed, dictionary]);

  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `genvoice-audio.${exportFormat}`;
    a.click();
  }, [audioUrl, exportFormat]);

  const handleCopy = useCallback(() => {
    if (audioUrl) navigator.clipboard.writeText(audioUrl);
  }, [audioUrl]);

  const handleAddDictionary = useCallback((entry: DictionaryEntry) => {
    setDictionary((prev) => [...prev, entry]);
  }, []);

  const handleRemoveDictionary = useCallback((index: number) => {
    setDictionary((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase"
        >
          TTS Studio
        </motion.h1>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 border-3 border-black rounded-xl bg-[#ffd800] px-4 py-2 text-sm font-extrabold uppercase tracking-wide shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5"
        >
          ← Back to Projects
        </Link>
      </div>

      {/* Split Panel Layout: 55/45 */}
      <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6">
        {/* LEFT PANEL (55%) */}
        <div className="space-y-6">
          <FadeIn>
            <div className="brutal-card p-6">
              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onSelect={setSelectedVoice}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="brutal-card p-6">
              <VoiceSettings speed={speed} onSpeedChange={setSpeed} />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="brutal-card p-6 flex-1">
              <TextInput value={text} onChange={setText} />
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !text.trim()}
              className="brutal-btn w-full py-6 text-2xl font-bold bg-[#00e676] disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Speech"}
            </button>
          </FadeIn>
        </div>

        {/* RIGHT PANEL (45%) */}
        <div className="space-y-6">
          <FadeIn delay={0.2}>
            <div className="brutal-card p-6 bg-[#e0f7fa]">
              <AudioPreview
                audioUrl={audioUrl}
                loading={generating}
                onDownload={handleDownload}
                onCopy={handleCopy}
                error={error}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="brutal-card p-6">
              <CustomDictionary
                dictionary={dictionary}
                onAdd={handleAddDictionary}
                onRemove={handleRemoveDictionary}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="brutal-card p-6">
              <ExportPanel
                format={exportFormat}
                onFormatChange={setExportFormat}
                onExport={handleDownload}
              />
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="bg-[#00e676] border-2 border-black px-3 py-1 font-bold text-sm shadow-[2px_2px_0_#000]">✓ APPROVED</span>
      </div>
    </main>
  );
}
```

---

## Task 9: Add Responsive Styles

**Files:** `frontend/src/app/studio/page.tsx` (add utility classes)

Trong Task 8 đã có `grid-cols-1 lg:grid-cols-[55fr_45fr]`, nhưng cần thêm mobile styles:

```css
/* Hoặc thêm inline trong className */
<div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6">
  {/* Mobile: stack vertically */}
  {/* Desktop: 55/45 split */}
</div>
```

---

## Task 10: Test & Verify

**Commands:**

```bash
cd frontend
npm run lint
npm run build
```

---

## Summary

| Task | File | Status |
|------|------|--------|
| 1 | VoiceSelector.tsx | - [ ] |
| 2 | VoiceSettings.tsx | - [ ] |
| 3 | TextInput.tsx | - [ ] |
| 4 | CustomDictionary.tsx | - [ ] |
| 5 | AudioPreview.tsx | - [ ] |
| 6 | ExportPanel.tsx | - [ ] |
| 7 | index.ts (barrel) | - [ ] |
| 8 | studio/page.tsx | - [ ] |
| 9 | Responsive | - [ ] |
| 10 | Test & Verify | - [ ] |

---

**Plan complete and saved to `.sdlc/SPEC008-frontend-tts-studio-ui-redesign/plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**