'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useT } from "@/shared/i18n";

interface AudioPreviewProps {
  audioUrl: string | null;
  loading: boolean;
  onDownload: (format: 'mp3' | 'wav') => void;
  onCopy: () => void;
  wavAvailable: boolean;
  mp3Size?: number;
  wavSize?: number;
  error?: string | null;
  progress: number;
  autoPlay?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

export function AudioPreview({ audioUrl, loading, onDownload, onCopy, wavAvailable, mp3Size, wavSize, error, progress, autoPlay, onPlayingChange }: AudioPreviewProps) {
  const t = useT();
  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-[12px] font-light text-xs">
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
            className="h-28 flex flex-col items-center justify-center border border-white/10 border-dashed rounded-[16px] bg-[#0D100A]/50"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mb-3 text-[var(--color-meridian-primary)]"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </motion.div>
            <p className="font-light text-[10px] uppercase tracking-[0.2em] text-[#D4D4D8]">
              {progress < 30 ? 'Đang tải model...' : progress < 60 ? 'Đang tạo giọng đọc...' : 'Đang hoàn thiện...'} 
              {Math.round(progress)}%
            </p>
            <div className="w-full max-w-[200px] bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        ) : audioUrl ? (
          <motion.div
            key="audio"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 rounded-[16px] border border-white/10 bg-[#0D100A]/50 p-4"
          >
            <audio
              controls
              className="w-full"
              src={audioUrl}
              autoPlay={autoPlay}
              onPlay={() => onPlayingChange?.(true)}
              onPause={() => onPlayingChange?.(false)}
              onEnded={() => onPlayingChange?.(false)}
            />
            <div className="flex gap-3 justify-center">
              <div className="relative group/download inline-flex">
                <button
                  type="button"
                  onClick={() => onDownload('mp3')}
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--color-meridian-primary)]/30 bg-[var(--color-meridian-primary)]/10 hover:bg-[var(--color-meridian-primary)]/20 rounded-[8px] rounded-r-none font-light uppercase tracking-widest text-[10px] text-[var(--color-meridian-secondary)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {mp3Size ? `${t.studio.audioDownload} MP3 (~${Math.round(mp3Size / 1024)}KB)` : t.studio.audioDownload}
                </button>
                {wavAvailable && (
                  <>
                    <button
                      type="button"
                      className="flex items-center px-2 py-2 border border-l-0 border-[var(--color-meridian-primary)]/30 bg-[var(--color-meridian-primary)]/10 hover:bg-[var(--color-meridian-primary)]/20 rounded-[8px] rounded-l-none text-[var(--color-meridian-secondary)] transition-all"
                      aria-label="Download options"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1A2E] border border-white/10 rounded-[8px] shadow-lg opacity-0 invisible group-hover/download:opacity-100 group-hover/download:visible transition-all z-50">
                      <button
                        type="button"
                        onClick={() => onDownload('wav')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-[8px] font-light"
                      >
                        <span>WAV (lossless</span>
                        <span className="text-[#A1A1AA]">
                          {wavSize ? `~${(wavSize / (1024 * 1024)).toFixed(1)}MB)` : ''}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onCopy}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-[8px] font-light uppercase tracking-widest text-[10px] text-gray-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                {t.studio.copyLink}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-36 flex flex-col items-center justify-center border border-white/10 border-dashed rounded-[16px] bg-[#0D100A]/30"
          >
            <div className="text-[#A1A1AA] mb-3 opacity-50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="font-light text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA]">{t.studio.noAudio}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}