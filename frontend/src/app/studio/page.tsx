"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";

import { VoiceSelector, VoiceSettings, TextInput, CustomDictionary, StudioHero, PreviewPanel, PronunciationCheck, GrammarFixModal, SmartChunking } from "@/features/studio";
import dynamic from "next/dynamic";

const StudioLibraryDrawer = dynamic(() => import("@/features/studio/components/StudioLibraryDrawer").then(mod => mod.StudioLibraryDrawer), { ssr: false });
import type { DictionaryEntry } from "@/features/studio";
import { getDictionaryEntries, createDictionaryEntry, deleteDictionaryEntry, updateDictionaryEntry } from "@/features/dictionary/api/dictionary-api";
import { getStudioVoices } from "@/features/voice/api/voice-api";
import { useTtsGenerate } from "@/features/tts";
import type { StudioVoice, NormalizationMeta } from "@/features/voice/types/voice-types";
import { useLocalLibrary } from "@/features/library/hooks/useLocalLibrary";
import { useNotifications } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import { getCurrentUser } from "@/features/auth/api/auth-api";

const STORAGE_KEY = "studio_draft_text";
const STORAGE_KEY_VOICE = "studio_voice_id";
const STORAGE_KEY_SPEED = "studio_speed";
const DEFAULT_TEXT = "Xin chào các bạn! Hôm nay chúng ta sẽ cùng nhau khám phá công nghệ TTS tuyệt vời.";

export default function StudioPage() {
  const t = useT();
  const { notify } = useNotifications();
  const [voices, setVoices] = useState<StudioVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentWavUrl, setCurrentWavUrl] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTextOverLimit, setIsTextOverLimit] = useState(false);
  const [normMeta, setNormMeta] = useState<NormalizationMeta | null>(null);
  const [isPronunciationOpen, setIsPronunciationOpen] = useState(false);
  const [isGrammarOpen, setIsGrammarOpen] = useState(false);
  const [isChunkingOpen, setIsChunkingOpen] = useState(false);
  const [chunks, setChunks] = useState<Array<{ text: string; label: string }>>([]);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  useEffect(() => {
    getCurrentUser().then(u => {
      setIsPro(u.subscription_tier === 'pro' || u.subscription_tier === 'enterprise');
    }).catch(() => {});
  }, []);
  
  const { saveLocalRecord } = useLocalLibrary();
  const { clientGenerate, progress: workerProgress, isUsingWorker, prefetchModel, cancelGeneration } = useTtsGenerate();

  useEffect(() => {
    let cancelled = false;

    const loadVoices = async () => {
      try {
        const nextVoices = await getStudioVoices();
        if (cancelled) return;
        setVoices(nextVoices);
        setSelectedVoice((current) => {
          const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
          if (savedVoice && nextVoices.some((voice) => voice.id === savedVoice)) return savedVoice;
          if (current && nextVoices.some((voice) => voice.id === current)) return current;
          return nextVoices[0]?.id || "";
        });
      } catch (loadError) {
        if (!cancelled) {
          setVoices([
            { id: "vi_female", name: "Giọng nữ tiếng Việt", lang: "Tiếng Việt", available: true },
            { id: "vi_male", name: "Giọng nam tiếng Việt", lang: "Tiếng Việt", available: true },
          ]);
          setSelectedVoice("vi_female");
          setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách giọng đọc.");
        }
      }
    };

    const loadDictionary = async () => {
      try {
        const entries = await getDictionaryEntries();
        if (!cancelled) setDictionary(entries);
      } catch {
        if (!cancelled) setDictionary([]);
      }
    };

    void loadVoices();
    void loadDictionary();

    return () => {
      cancelled = true;
    };
  }, []);

  // Prefetch ONNX model when voice changes
  useEffect(() => {
    if (selectedVoice && voices.length > 0) {
      prefetchModel(selectedVoice);
    }
  }, [selectedVoice, voices.length, prefetchModel]);

  // Restore draft text from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setText(saved);
  }, []);

  // Restore speed from localStorage on mount
  useEffect(() => {
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
    if (savedSpeed) setSpeed(parseFloat(savedSpeed));
  }, []);

  const sortedVoices = useMemo(() => [...voices].sort((a, b) => a.name.localeCompare(b.name, "vi")), [voices]);
  const voiceId = useMemo(() => selectedVoice || voices[0]?.id || "vi_female", [selectedVoice, voices]);

  const handleSelectVoice = useCallback((nextVoiceId: string) => {
    setSelectedVoice(nextVoiceId);
    localStorage.setItem(STORAGE_KEY_VOICE, nextVoiceId);
  }, []);
  const handleSpeedChange = useCallback((nextSpeed: number) => {
    setSpeed(nextSpeed);
    localStorage.setItem(STORAGE_KEY_SPEED, String(nextSpeed));
  }, []);
  const handleTextChange = useCallback((nextText: string) => {
    setText(nextText);
    localStorage.setItem(STORAGE_KEY, nextText);
  }, []);
  const handleCopyAudioUrl = useCallback(async () => { if (audioUrl) await navigator.clipboard.writeText(audioUrl); }, [audioUrl]);
  const handleDownloadAudio = useCallback((format: 'mp3' | 'wav' = 'mp3') => {
    const url = format === 'wav' ? currentWavUrl : audioUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `genvoice-audio.${format}`;
    a.click();
  }, [audioUrl, currentWavUrl]);

  const handleGenerationSuccess = useCallback((nextAudioUrl: string, duration: number, normalization?: NormalizationMeta | null, mp3Url?: string, wavUrl?: string) => {
    setAudioUrl(mp3Url || nextAudioUrl);
    if (wavUrl) setCurrentWavUrl(wavUrl);
    setShowSuccessCard(true);
    setTimeout(() => {
      const audioEl = document.querySelector('audio') as HTMLAudioElement | null;
      audioEl?.play().catch(() => {});
    }, 100);
    if (normalization) setNormMeta(normalization);
    notify({ severity: "success", title: t.studio.successTitle, message: t.studio.successMessage, source: "studio", actionLabel: t.studio.audioDownload, actionHref: mp3Url || nextAudioUrl });
    const mp3DataUrl = mp3Url || nextAudioUrl;
    const wavDataUrl = wavUrl || nextAudioUrl;
    const base64Data = mp3DataUrl.split(',')[1] || '';
    const fileSizeBytes = Math.round(base64Data.length * 0.75);
    saveLocalRecord({ 
      id: crypto.randomUUID(), 
      audio_url: wavDataUrl,
      audio_mp3: mp3DataUrl,
      text_content: text, 
      voice_id: voiceId,
      duration,
      file_size_bytes: fileSizeBytes,
      created_at: new Date().toISOString() 
    });
  }, [saveLocalRecord, text, voiceId]);

  const handleGenerationError = useCallback((generateError: unknown) => {
    const message = generateError instanceof Error ? generateError.message : t.studio.errorGenerate;
    setError(message);
    notify({ severity: "error", title: t.studio.errorGenerateTitle, message, source: "studio" });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || isTextOverLimit) return;
    setGenerating(true);
    setAudioUrl(null);
    setCurrentWavUrl(null);
    setError(null);
    setNormMeta(null);
    setShowSuccessCard(false);

    try {
      const response = await clientGenerate({
        text,
        voice_id: voiceId,
        speed,
          user_dictionary: dictionary.length > 0 ? dictionary.map(d => ({
          word: d.word,
          pronunciation: d.pronunciation || d.word,
        })) : undefined,
      });
      handleGenerationSuccess(response.audio_url, response.duration, response.normalization, response.audio_mp3, response.audio_wav);
    } catch (generateError) {
      handleGenerationError(generateError);
    } finally {
      setGenerating(false);
    }
  }, [text, isTextOverLimit, voiceId, speed, dictionary, handleGenerationError, handleGenerationSuccess, clientGenerate]);

  const handleAddDictionary = useCallback(async (entry: { word: string; pronunciation?: string }) => {
    try {
      const saved = await createDictionaryEntry({ word: entry.word, pronunciation: entry.pronunciation || entry.word }) as unknown as DictionaryEntry;
      setDictionary((prev) => [...prev, saved]);
      notify({ severity: "success", title: "Đã thêm", message: `Đã thêm "${entry.word}" vào từ điển.`, source: "studio" });
    } catch {
      setDictionary((prev) => [...prev, { ...entry, id: Math.random().toString(), createdAt: new Date().toISOString() } as unknown as DictionaryEntry]);
      notify({ severity: "error", title: "Lỗi", message: "Không thể thêm từ vào từ điển.", source: "studio" });
    }
  }, [notify]);

  const handleRemoveDictionary = useCallback(async (index: number) => {
    const entry = dictionary[index];
    const word = entry?.word || "";
    if (entry?.id) {
      try {
        await deleteDictionaryEntry(entry.id);
      } catch {
        // keep UI responsive
      }
    }
    setDictionary((prev) => prev.filter((_, i) => i !== index));
    notify({ severity: "success", title: "Đã xóa", message: `Đã xóa "${word}" khỏi từ điển.`, source: "studio" });
  }, [dictionary, notify]);

  const handleEditDictionary = useCallback(async (index: number, updated: Partial<DictionaryEntry>) => {
    const entry = dictionary[index];
    const word = updated.word || entry?.word || "";
    if (entry?.id) {
      try {
        const saved = await updateDictionaryEntry(entry.id, { word: updated.word, pronunciation: updated.pronunciation });
        setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...saved } : e)));
      } catch {
        setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...updated } : e)));
        notify({ severity: "error", title: "Lỗi", message: `Không thể cập nhật "${word}".`, source: "studio" });
        return;
      }
    } else {
      setDictionary((prev) => prev.map((e, i) => (i === index ? { ...e, ...updated } : e)));
    }
    notify({ severity: "success", title: "Đã cập nhật", message: `Đã cập nhật "${word}".`, source: "studio" });
  }, [dictionary, notify]);

  const handleGrammarApply = useCallback((corrected: string) => {
    setText(corrected);
    localStorage.setItem(STORAGE_KEY, corrected);
    setIsGrammarOpen(false);
  }, []);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden px-4 pb-16 pt-24 text-[#F4F4F5] selection:bg-[#6366F1]/30">
      <div className="relative mx-auto max-w-7xl space-y-6">
        <StudioHero />

        {error ? <FadeIn delay={0.1}><div className="aether-glass-wrapper rounded-[24px]" role="alert"><div className="aether-glass rounded-[24px] p-4 text-sm font-medium text-red-400 bg-red-950/20 border-red-500/20">{error}</div></div></FadeIn> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
          <div className="space-y-3 flex flex-col h-full">
            <FadeIn delay={0.2} className="flex-1 flex flex-col min-h-[120px]">
              {/* Toolbar */}
              <div className="aether-glass-wrapper rounded-[24px] mb-3">
                <div className="aether-glass rounded-[24px] p-3 flex items-center gap-2 flex-wrap">
                  <button onClick={() => setIsGrammarOpen(true)} disabled={!text.trim() || !isPro} className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                    Sửa chính tả {!isPro && <span className="text-[#C968F7] bg-[#C968F7]/10 border border-[#C968F7]/30 rounded-full px-2 py-0.5 text-[8px]">PRO</span>}
                  </button>
                  <button onClick={() => setIsPronunciationOpen(true)} disabled={!text.trim() || !isPro} className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
                    Kiểm tra phát âm {!isPro && <span className="text-[#C968F7] bg-[#C968F7]/10 border border-[#C968F7]/30 rounded-full px-2 py-0.5 text-[8px]">PRO</span>}
                  </button>
                  <button onClick={() => setIsChunkingOpen(true)} disabled={!text.trim() || text.length < 1000 || !isPro} className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                    Chia đoạn {!isPro && <span className="text-[#C968F7] bg-[#C968F7]/10 border border-[#C968F7]/30 rounded-full px-2 py-0.5 text-[8px]">PRO</span>}
                  </button>
                </div>
              </div>
              <TextInput value={text} onChange={handleTextChange} onOverLimit={setIsTextOverLimit} />
            </FadeIn>
            
            {chunks.length > 0 && (
              <div className="mt-4 space-y-2">
                {chunks.map((chunk, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <span className="text-[10px] uppercase tracking-widest text-[#818CF8]">{chunk.label}</span>
                    <p className="text-sm text-[#D4D4D8] mt-1">{chunk.text.slice(0, 100)}...</p>
                  </div>
                ))}
              </div>
            )}
            
            <FadeIn delay={0.3}><div aria-live="polite"><PreviewPanel audioUrl={audioUrl} onCopy={handleCopyAudioUrl} onDownload={handleDownloadAudio} loading={generating} normMeta={normMeta} progress={workerProgress} autoPlay={!!audioUrl} wavAvailable={!!currentWavUrl && isPro} mp3Size={audioUrl ? Math.round((audioUrl.split(',')[1] || '').length * 0.75) : undefined} wavSize={currentWavUrl ? Math.round((currentWavUrl.split(',')[1] || '').length * 0.75) : undefined} /></div></FadeIn>
          </div>

          <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <FadeIn delay={0.4}><VoiceSelector voices={sortedVoices} selectedVoice={selectedVoice} onSelect={handleSelectVoice} /></FadeIn>
            <FadeIn delay={0.5}><VoiceSettings speed={speed} onSpeedChange={handleSpeedChange} /></FadeIn>
            <FadeIn delay={0.6}><CustomDictionary dictionary={dictionary} onAdd={handleAddDictionary} onRemove={handleRemoveDictionary} onEdit={handleEditDictionary} /></FadeIn>
          </div>
        </div>

        {/* Floating Action Bar */}
        {text.trim().length > 0 && (
          <div className="sticky bottom-8 z-30 flex justify-center pt-6 pb-4">
            <div className="aether-glass-wrapper rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="aether-glass rounded-full p-2 flex items-center gap-3" style={{ borderRadius: '9999px' }}>
                <button
                  onClick={handleGenerate}
                  disabled={generating || isTextOverLimit}
                  className="aether-btn aether-btn-primary h-12 px-8 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-[#111111] border-t-transparent rounded-full"></span>
                      {t.studio.generating}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                      {t.studio.generate}
                    </>
                  )}
                </button>
                {generating && (
                  <button onClick={() => cancelGeneration()} className="h-12 px-6 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all">
                    Dừng
                  </button>
                )}
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="h-12 px-6 rounded-full bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/30 text-[#818CF8] text-sm font-medium hover:text-white hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 hover:border-[#6366F1]/50 transition-all flex items-center gap-2.5 shadow-[0_0_12px_rgba(99,102,241,0.08)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
                  Thư viện
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <StudioLibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
      <PronunciationCheck
        isOpen={isPronunciationOpen}
        text={text}
        onClose={() => setIsPronunciationOpen(false)}
         onAddToDictionary={(entry) => handleAddDictionary({
          word: entry.word,
          pronunciation: entry.pronunciation,
        })}
      />
      <GrammarFixModal
        isOpen={isGrammarOpen}
        text={text}
        onClose={() => setIsGrammarOpen(false)}
        onApply={handleGrammarApply}
      />
      <SmartChunking
        isOpen={isChunkingOpen}
        text={text}
        onClose={() => setIsChunkingOpen(false)}
        onChunksReady={(newChunks) => {
          setChunks(newChunks);
          setIsChunkingOpen(false);
        }}
      />
    </main>
  );
}


