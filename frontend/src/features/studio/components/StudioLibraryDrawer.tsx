'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalLibrary } from '@/features/library/hooks/useLocalLibrary';
import type { VoiceInfo } from '@/features/voice/hooks/useVoiceMap';
import { useT } from "@/shared/i18n";
import Link from 'next/link';

interface StudioLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  voiceMap?: Map<string, VoiceInfo>;
}

interface AudioRecord {
  id: string;
  text_content: string;
  voice_id: string;
  audio_url: string | null;
  audio_mp3?: string;
  duration: number | null;
  created_at: string;
}

function VoiceBadge({ voiceId, voiceMap }: { voiceId: string; voiceMap?: Map<string, VoiceInfo> }) {
  const info = voiceMap?.get(voiceId);
  const name = info?.name ?? voiceId;
  const isPremium = info?.isPremium ?? false;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest rounded-full px-2 py-0.5 shadow-[0_0_6px_rgba(99,102,241,0.1)] ${
      isPremium
        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
        : 'text-[#818CF8] bg-[#6366F1]/10 border border-[#818CF8]/30'
    }`}>
      {name}
      {isPremium && (
        <span className="text-[7px] font-bold text-amber-500">PRO</span>
      )}
    </span>
  );
}

export function StudioLibraryDrawer({ isOpen, onClose, voiceMap }: StudioLibraryDrawerProps) {
  const t = useT();
  const { records, loading, refreshLocalRecords } = useLocalLibrary();
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshLocalRecords();
    } else {
      setPlaying(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [isOpen, refreshLocalRecords]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = (record: AudioRecord) => {
    const playbackUrl = record.audio_mp3 || record.audio_url;
    if (!playbackUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (playing === record.id) {
      setPlaying(null);
      return;
    }

    setPlaying(record.id);
    const audio = new Audio(playbackUrl);
    audio.onended = () => {
      setPlaying(null);
      audioRef.current = null;
    };
    audioRef.current = audio;
    audio.play();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return typeof document !== "undefined" ? createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="library-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[#050508]/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.aside
            key="library-drawer"
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.3 }}
            className="fixed right-0 top-0 z-[101] flex h-dvh w-[420px] max-w-[92vw] flex-col overflow-hidden border-l border-white/10 bg-[#050508]/95 backdrop-blur-[40px] text-[#F4F4F5] shadow-[-10px_0_40px_rgba(0,0,0,0.6)]"
          >
            <div className="shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-[#6366F1]/5 to-transparent px-6 pt-20 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-white">{t.studio.libraryAudioLibrary}</h2>
                  <p className="text-[11px] font-light text-[#A1A1AA] mt-1">
                    {loading ? t.common.loading : t.studio.libraryRecordCount.replace('{n}', String(records.length))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                  aria-label={t.studio.libraryClose}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="custom-scroll flex-1 overflow-y-auto divide-y divide-white/5 p-4">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-[#A1A1AA]">
                  <div className="w-5 h-5 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{t.common.loading}</p>
                </div>
              ) : records.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-[#A1A1AA] gap-4">
                  <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1">{t.studio.libraryEmptyHeading}</p>
                    <p className="text-xs font-light">{t.studio.libraryEmptyDesc}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record, idx) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all"
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => handlePlay(record)}
                          disabled={!record.audio_url}
                          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            playing === record.id
                              ? "bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                              : "border border-white/10 text-[#D4D4D8] hover:text-white hover:border-white/20 hover:bg-white/5"
                          } ${!record.audio_url ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                          {playing === record.id ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-light leading-relaxed text-[#D4D4D8] line-clamp-2 group-hover:text-white transition-colors">
                            {record.text_content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <VoiceBadge voiceId={record.voice_id} voiceMap={voiceMap} />
                            {record.duration && (
                              <span className="text-[9px] font-light text-[#A1A1AA]">{record.duration.toFixed(1)}s</span>
                            )}
                            <span className="text-[9px] font-light text-[#71717A] ml-auto">{formatDate(record.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-white/[0.06] px-6 py-5">
              <Link href="/library" onClick={onClose}>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/30 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest hover:text-white hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 transition-all active:scale-[0.98] shadow-[0_0_12px_rgba(99,102,241,0.08)]">
                  <span className="flex items-center justify-center gap-2">
                    {t.studio.libraryManage}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </span>
                </button>
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  ) : null;
}
