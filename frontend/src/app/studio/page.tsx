"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FadeIn } from "@/components/motion";
import { VoiceSelector, VoiceSettings, TextInput, CustomDictionary, StudioHeader, PreviewPanel } from "@/features/studio";
import dynamic from "next/dynamic";

const StudioLibraryDrawer = dynamic(() => import("@/features/studio/components/StudioLibraryDrawer").then(mod => mod.StudioLibraryDrawer), { ssr: false });
import type { DictionaryEntry } from "@/features/studio";
import { getDictionaryEntries, createDictionaryEntry, deleteDictionaryEntry, updateDictionaryEntry } from "@/features/dictionary/api/dictionary-api";
import { getStudioVoices } from "@/features/voice/api/voice-api";
import { useVoiceMap } from "@/features/voice/hooks/useVoiceMap";
import { useTtsGenerate } from "@/features/tts";
import type { StudioVoice } from "@/features/voice/types/voice-types";
import { useLocalLibrary } from "@/features/library/hooks/useLocalLibrary";
import { useNotifications } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/features/auth";

const STORAGE_KEY = "studio_draft_text";
const STORAGE_KEY_VOICE = "studio_voice_id";
const STORAGE_KEY_SPEED = "studio_speed";
const DEFAULT_TEXT = "Xin chào các bạn! Hôm nay chúng ta sẽ cùng nhau khám phá công nghệ TTS tuyệt vời.";

export default function StudioPage() {
  const t = useT();
  const { notify } = useNotifications();
  const { user } = useAuth();
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';
  const { voiceMap } = useVoiceMap();
  const [voices, setVoices] = useState<StudioVoice[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentWavUrl, setCurrentWavUrl] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTextOverLimit, setIsTextOverLimit] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const pendingNavRef = useRef<((...args: any[]) => void) | null>(null);

  const { saveLocalRecord, records: libraryRecords } = useLocalLibrary();
  const { clientGenerate, progress, isUsingWorker, generating: hookGenerating, prefetchModel, cancelGeneration } = useTtsGenerate();

  // Navigation warning when generating (browser + client-side)
  useEffect(() => {
    if (!hookGenerating) return;

    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    let historyLocked = false;

    const isExternalUrl = (href: string) =>
      /^(https?:|mailto:|tel:)/i.test(href);

    const clickHandler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (isExternalUrl(href)) return;
      if (anchor.target === '_blank') return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.hasAttribute('data-no-warn')) return;

      e.preventDefault();
      e.stopPropagation();
      pendingNavRef.current = () => {
        window.location.assign(href);
      };
      Promise.resolve().then(() => setShowLeaveWarning(true));
    };

    const popStateHandler = (e: PopStateEvent) => {
      e.preventDefault();
      if (!historyLocked) {
        window.history.pushState(null, '', window.location.href);
        historyLocked = true;
      }
      pendingNavRef.current = () => {
        window.removeEventListener('popstate', popStateHandler);
        window.history.back();
      };
      Promise.resolve().then(() => setShowLeaveWarning(true));
    };

    document.addEventListener('click', clickHandler, true);
    window.addEventListener('popstate', popStateHandler);
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      document.removeEventListener('click', clickHandler, true);
      window.removeEventListener('popstate', popStateHandler);
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      pendingNavRef.current = null;
    };
  }, [hookGenerating]);

  const handleRetryVoices = useCallback(async () => {
    setVoiceLoading(true);
    setError(null);
    try {
      const nextVoices = await getStudioVoices();
      setVoices(nextVoices);
      setError(null);
    } catch (loadError) {
      setVoices([
        { id: "baouyen", name: "Bảo Uyên (Nữ miền Bắc)", lang: "Tiếng Việt", available: true, is_premium: false },
        { id: "ngochuyen", name: "Ngọc Huyền (Nữ miền Bắc)", lang: "Tiếng Việt", available: true, is_premium: false },
        { id: "manhdung", name: "Mạnh Dũng (Nam miền Nam)", lang: "Tiếng Việt", available: true, is_premium: false },
      ]);
      setError(loadError instanceof Error ? loadError.message : t.studio.errorLoadVoices);
    } finally {
      setVoiceLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    void handleRetryVoices();

    const loadDictionary = async () => {
      try {
        const entries = await getDictionaryEntries();
        if (!cancelled) setDictionary(entries);
      } catch {
        if (!cancelled) setDictionary([]);
      }
    };

    void loadDictionary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedVoice && voices.length > 0) {
      prefetchModel(selectedVoice);
    }
  }, [selectedVoice, voices.length, prefetchModel]);

  useEffect(() => {
    const savedText = localStorage.getItem(STORAGE_KEY);
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
    const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
    if (savedText) setText(savedText);
    if (savedSpeed) setSpeed(parseFloat(savedSpeed));
    if (savedVoice) setSelectedVoice(savedVoice);
  }, []);

  useEffect(() => {
    if (!selectedVoice && voices.length > 0) {
      const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
      if (savedVoice && voices.some(v => v.id === savedVoice)) {
        setSelectedVoice(savedVoice);
      } else {
        setSelectedVoice(voices[0]?.id);
      }
    }
  }, [voices, selectedVoice]);

  const sortedVoices = useMemo(() => [...voices].sort((a, b) => a.name.localeCompare(b.name, "vi")), [voices]);
  const voiceId = useMemo(() => selectedVoice || voices[0]?.id || "baouyen", [selectedVoice, voices]);

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
  const handleCopyAudioUrl = useCallback(async () => {
    if (!audioUrl) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(audioUrl);
    }
  }, [audioUrl]);
  const handleDownloadAudio = useCallback((format: 'mp3' | 'wav' = 'mp3') => {
    const url = format === 'wav' ? currentWavUrl : audioUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `genvoice-audio.${format}`;
    a.click();
  }, [audioUrl, currentWavUrl]);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || isTextOverLimit || hookGenerating) return;
    setAudioUrl(null);
    setCurrentWavUrl(null);
    setError(null);

    try {
      const selectedModelKey = voices.find(v => v.id === voiceId)?.model_key;

      const response = await clientGenerate({
        text,
        voice_id: voiceId,
        speed,
        model_key: selectedModelKey,
        user_dictionary: dictionary.length > 0 ? dictionary.map(d => ({
          word: d.word,
          pronunciation: d.pronunciation || d.word,
        })) : undefined,
      });
      setAudioUrl(response.audio_mp3 || response.audio_url);
      if (response.audio_wav) setCurrentWavUrl(response.audio_wav);
      notify({ severity: "success", title: t.studio.successTitle, message: t.studio.successMessage, source: "studio", actionLabel: t.studio.audioDownload, actionHref: response.audio_mp3 || response.audio_url });
      const mp3DataUrl = response.audio_mp3 || response.audio_url;
      const base64Data = mp3DataUrl.split(',')[1] || '';
      const fileSizeBytes = Math.round(base64Data.length * 0.75);
      saveLocalRecord({ 
        id: crypto.randomUUID(), 
        audio_url: response.audio_wav || response.audio_url,
        audio_mp3: mp3DataUrl,
        text_content: text, 
        voice_id: voiceId,
        duration: response.duration,
        file_size_bytes: fileSizeBytes,
        created_at: new Date().toISOString() 
      });
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : t.studio.errorGenerate;
      setError(message);
      notify({ severity: "error", title: t.studio.errorGenerateTitle, message, source: "studio" });
    }
  }, [text, isTextOverLimit, hookGenerating, voiceId, speed, dictionary, clientGenerate, saveLocalRecord, notify, t]);

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

  return (
    <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden px-4 pb-16 pt-4 text-[#F4F4F5] selection:bg-[#6366F1]/30">
      <div className="relative mx-auto max-w-7xl space-y-6">
        <FadeIn delay={0.1}>
          <StudioHeader onOpenLibrary={() => setIsLibraryOpen(true)} libraryCount={libraryRecords.length} />
        </FadeIn>

        {error ? (
          <FadeIn delay={0.15}>
            <div className="aether-glass-wrapper rounded-[24px]" role="alert">
              <div className="aether-glass rounded-[24px] p-4 text-sm font-medium text-red-400 bg-red-950/20 border-red-500/20">
                {error}
              </div>
            </div>
          </FadeIn>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            <FadeIn delay={0.2}>
              <TextInput value={text} onChange={handleTextChange} onOverLimit={setIsTextOverLimit} />
            </FadeIn>

            {/* Mobile: voice selector + settings before generate & preview */}
            <div className="space-y-4 md:hidden">
              <VoiceSelector voices={sortedVoices} selectedVoice={selectedVoice || ""} onSelect={handleSelectVoice} isPro={isPro} loading={voiceLoading} error={voiceLoading ? null : error} onRetry={handleRetryVoices} />
              <VoiceSettings speed={speed} onSpeedChange={handleSpeedChange} />
            </div>

            {/* Mobile generate button */}
            <FadeIn delay={0.25} className="block md:hidden">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={hookGenerating || isTextOverLimit || !text.trim()}
                  className="aether-btn aether-btn-primary w-full py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {hookGenerating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-[#111111] border-t-transparent rounded-full"></span>
                      {t.studio.generating}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                      </svg>
                      {t.studio.generate}
                    </>
                  )}
                </button>
                {isTextOverLimit && (
                  <p className="text-[11px] text-red-400 text-center font-medium">
                    Văn bản vượt quá giới hạn ký tự. Vui lòng rút ngắn.
                  </p>
                )}
                {!text.trim() && !isTextOverLimit && (
                  <p className="text-[11px] text-[#71717A] text-center">
                    Nhập văn bản để bắt đầu tạo giọng nói
                  </p>
                )}
                {hookGenerating && (
                  <button
                    onClick={() => cancelGeneration()}
                    className="w-full py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
                  >
                    {t.common.cancel}
                  </button>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div aria-live="polite">
                <PreviewPanel
                  audioUrl={audioUrl}
                  onCopy={handleCopyAudioUrl}
                  onDownload={handleDownloadAudio}
                  loading={hookGenerating}
                  progress={progress}
                  autoPlay={!!audioUrl}
                  wavAvailable={!!currentWavUrl}
                  mp3Size={audioUrl ? Math.round((audioUrl.split(',')[1] || '').length * 0.75) : undefined}
                  wavSize={currentWavUrl ? Math.round((currentWavUrl.split(',')[1] || '').length * 0.75) : undefined}
                  error={error}
                />
              </div>
            </FadeIn>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <FadeIn delay={0.4} className="hidden md:block">
              <VoiceSelector voices={sortedVoices} selectedVoice={selectedVoice || ""} onSelect={handleSelectVoice} isPro={isPro} loading={voiceLoading} error={voiceLoading ? null : error} onRetry={handleRetryVoices} />
            </FadeIn>
            <FadeIn delay={0.5} className="hidden md:block">
              <VoiceSettings speed={speed} onSpeedChange={handleSpeedChange} />
            </FadeIn>
            <FadeIn delay={0.6}>
              <CustomDictionary dictionary={dictionary} onAdd={handleAddDictionary} onRemove={handleRemoveDictionary} onEdit={handleEditDictionary} />
            </FadeIn>
            
            <FadeIn delay={0.7} className="hidden md:block">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={hookGenerating || isTextOverLimit || !text.trim()}
                  className="aether-btn aether-btn-primary w-full py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {hookGenerating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-[#111111] border-t-transparent rounded-full"></span>
                      {t.studio.generating}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                      </svg>
                      {t.studio.generate}
                    </>
                  )}
                </button>
                {isTextOverLimit && (
                  <p className="text-[11px] text-red-400 text-center font-medium">
                    Văn bản vượt quá giới hạn ký tự. Vui lòng rút ngắn.
                  </p>
                )}
                {!text.trim() && !isTextOverLimit && (
                  <p className="text-[11px] text-[#71717A] text-center">
                    Nhập văn bản để bắt đầu tạo giọng nói
                  </p>
                )}
                {hookGenerating && (
                  <button
                    onClick={() => cancelGeneration()}
                    className="w-full py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
                  >
                    {t.common.cancel}
                  </button>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      <StudioLibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} voiceMap={voiceMap} />

      <ConfirmModal
        open={showLeaveWarning}
        title={t.studio.leaveWarningTitle}
        message={t.studio.leaveWarningMessage}
        confirmLabel={t.studio.leaveWarningConfirm}
        cancelLabel={t.studio.leaveWarningCancel}
        variant="danger"
        onConfirm={() => {
          setShowLeaveWarning(false);
          pendingNavRef.current?.();
          pendingNavRef.current = null;
        }}
        onClose={() => {
          setShowLeaveWarning(false);
          pendingNavRef.current = null;
        }}
      />
    </main>
  );
}
