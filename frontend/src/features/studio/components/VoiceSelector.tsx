'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useT } from "@/shared/i18n";
import { UiSelect } from "@/components/ui/UiSelect";
import { notificationService } from "@/shared/notifications/notification-store";

interface Voice {
  id: string;
  name: string;
  lang: string;
  available: boolean;
  sample_url?: string | null;
  is_premium?: boolean;
}

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  isPro?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function VoiceSelector({ voices, selectedVoice, onSelect, isPro = false, loading = false, error, onRetry }: VoiceSelectorProps) {
  const t = useT();
  const availableVoices = voices.filter(v => v.available);
  const selected = voices.find(v => v.id === selectedVoice);
  const lockedByTier = !isPro;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePreview = () => {
    if (!selected?.sample_url) return;

    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    const audio = new Audio(selected.sample_url);
    audio.onended = () => {
      setPlaying(false);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPlaying(false);
      audioRef.current = null;
      notificationService.notify({ severity: "error", title: t.studio.playbackErrorTitle, message: t.studio.playbackErrorMsg });
    };
    audioRef.current = audio;
    audio.play().catch(() => {
      setPlaying(false);
      audioRef.current = null;
      notificationService.notify({ severity: "error", title: t.studio.playbackErrorTitle, message: t.studio.playbackErrorMsg });
    });
    setPlaying(true);
  };

  return (
    <div className="aether-glass-wrapper rounded-[24px] transition-all duration-300 group hover:opacity-90">
      <div className="aether-glass rounded-[24px] p-4">
        <label className="block text-[14px] font-medium tracking-wide text-[#A1A1AA] mb-2">{t.studio.voiceSelect}</label>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-[42px] bg-white/5 rounded-xl" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-white/5 rounded-full" />
              <div className="h-5 w-20 bg-white/5 rounded-full" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-3">
            <p className="text-[11px] text-red-400 text-center">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
              >
                {t.common.retry}
              </button>
            )}
          </div>
        ) : (
          <>
        <UiSelect
          value={selectedVoice}
          onChange={onSelect}
          options={[
            ...availableVoices.map((voice) => {
              const isLocked = lockedByTier && voice.is_premium;
              return {
                value: voice.id,
                label: voice.is_premium
                  ? `${voice.name} \u{1F512} PRO`
                  : voice.name,
                disabled: isLocked,
              };
            }),
            ...voices.filter(v => !v.available).map((voice) => ({
              value: voice.id,
              label: `${voice.name} (${t.studio.comingSoon})`,
              disabled: true,
            })),
          ]}
          buttonClassName="bg-transparent border-b border-[#333333] text-[#F4F4F5] hover:border-[#6366F1] font-medium text-[15px] pb-3"
        />
        {selected && (
          <div className="flex items-center gap-2 mt-3 min-w-0">
            <p className="text-[12px] font-normal tracking-wide text-[#71717A] opacity-80 shrink-0">{selected.lang}</p>
            {selected.sample_url && (
              <button
                type="button"
                onClick={handleTogglePreview}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-300 active:scale-[0.96] whitespace-nowrap shrink-0 ${
                  playing
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-white border border-white/20 shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                    : 'bg-white/5 border border-white/10 text-[#D4D4D8] hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
                title={t.studio.previewVoice}
              >
                {playing ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#C968F7] opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                    {t.studio.playing}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                    {t.studio.previewVoice}
                  </>
                )}
              </button>
            )}
            {lockedByTier && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap shrink-0 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 hover:text-white hover:from-amber-500/30 hover:to-amber-600/20 hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-300 active:scale-[0.96]"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {t.studio.upgradePro}
              </Link>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
