"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from "@/shared/i18n";
import { UiChip } from "@/components/ui/ui-kit";
import { AudioPreview } from "./AudioPreview";
import type { StreamingStatus } from "@/features/tts/hooks/useTtsGenerate";

export const PreviewPanel = React.memo(function PreviewPanel({ 
  audioUrl, onCopy, onDownload, loading, progress, autoPlay, wavAvailable, mp3Size, wavSize, error,
  streamingStatus, streamingProgress, isPreviewPlaying, onTogglePreview
}: { 
  audioUrl: string | null; 
  onCopy: () => Promise<void>; 
  onDownload: (format: 'mp3' | 'wav') => void; 
  loading: boolean; 
  progress: number; 
  autoPlay?: boolean; 
  wavAvailable: boolean; 
  mp3Size?: number; 
  wavSize?: number; 
  error?: string | null;
  streamingStatus?: StreamingStatus;
  streamingProgress?: { current: number; total: number } | null;
  isPreviewPlaying?: boolean;
  onTogglePreview?: () => void;
}) {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const handlePlayingChange = useCallback((playing: boolean) => setIsPlaying(playing), []);

  // Auto-fade "Đã lưu" notification after 3 seconds
  useEffect(() => {
    if (streamingStatus === 'saved') {
      setSavedVisible(true);
      const timer = setTimeout(() => setSavedVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setSavedVisible(false);
    }
  }, [streamingStatus]);

  const getBadgeContent = () => {
    if (streamingStatus === 'streaming') return { text: '🎵 Đang phát', className: 'bg-[#C968F7]/10 text-[#C968F7] border-[#C968F7]/20' };
    if (streamingStatus === 'saving') return { text: '💾 Đang lưu...', className: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' };
    if (streamingStatus === 'saved' && savedVisible) return { text: '✅ Đã lưu', className: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' };
    if (streamingStatus === 'save-failed') return { text: '⚠ Lỗi lưu', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
    if (audioUrl) return { text: t.studio.ready, className: 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20' };
    if (loading) return { text: t.studio.generating, className: 'bg-transparent border-[#333333] text-[#71717A] shadow-none' };
    return { text: t.studio.waiting, className: 'bg-transparent border-[#333333] text-[#71717A] shadow-none' };
  };
  const badge = getBadgeContent();
  
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[18px] font-semibold tracking-wide text-white">{t.studio.previewTitle}</h2>
          <UiChip className={badge.className}>
            {badge.text}
          </UiChip>
        </div>

        {/* Unified Streaming & Saving Box */}
        <AnimatePresence mode="wait">
          {(streamingStatus === 'streaming' || streamingStatus === 'saving') && (
            <motion.div
              key="streaming-box"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-28 mb-3 flex flex-col items-center justify-center border border-[#C968F7]/30 rounded-[16px] bg-[#0D100A]/60 relative overflow-hidden shadow-[0_0_15px_rgba(201,104,247,0.1)]"
            >
              {/* Waveform */}
              <div className="flex items-center justify-center gap-[3px] h-8 mb-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-[3px] rounded-full bg-[#C968F7]"
                    animate={{
                      height: isPreviewPlaying ? [8, 14 + Math.sin(i * 1.5) * 12, 6, 18, 8] : 4,
                      opacity: isPreviewPlaying ? [0.4, 1, 0.5, 0.8, 0.4] : 0.3,
                    }}
                    transition={{
                      height: { duration: 0.6 + i * 0.04, repeat: Infinity, repeatType: 'mirror' },
                      opacity: { duration: 0.8 + i * 0.05, repeat: Infinity, repeatType: 'mirror' },
                    }}
                  />
                ))}
              </div>

              {/* Status Text & Controls */}
              <div className="flex items-center gap-3">
                {streamingStatus === 'streaming' && (
                  <button
                    onClick={onTogglePreview}
                    className="h-6 w-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {isPreviewPlaying ? (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
                    ) : (
                      <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                )}
                {streamingStatus === 'saving' && (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-[#C968F7] border-t-transparent rounded-full" />
                )}
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#D4D4D8] font-medium">
                  {streamingStatus === 'streaming' 
                    ? `Đang phát trực tiếp... ${streamingProgress ? `(Đoạn ${streamingProgress.current}/${streamingProgress.total})` : ''}`
                    : 'Đang lưu vào thư viện...'}
                </p>
              </div>

              {/* Progress Bar (Bottom edge) */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C968F7] to-[#6366F1]"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: streamingStatus === 'saving' 
                      ? '100%' 
                      : `${streamingProgress ? (streamingProgress.current / streamingProgress.total) * 100 : 0}%` 
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Standalone Waveform for Static Playback */}
        {isPlaying && streamingStatus !== 'streaming' && streamingStatus !== 'saving' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-[3px] mb-3"
          >
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-[#6366F1]"
                animate={{
                  height: [8, 14 + Math.sin(i * 1.5) * 12, 6, 18, 8],
                  opacity: [0.4, 1, 0.5, 0.8, 0.4],
                }}
                transition={{
                  height: { duration: 0.6 + i * 0.04, repeat: Infinity, repeatType: 'mirror' },
                  opacity: { duration: 0.8 + i * 0.05, repeat: Infinity, repeatType: 'mirror' },
                }}
              />
            ))}
          </motion.div>
        )}

        <AudioPreview 
          audioUrl={audioUrl} 
          loading={loading} 
          onCopy={onCopy} 
          onDownload={onDownload} 
          progress={progress} 
          autoPlay={autoPlay} 
          onPlayingChange={handlePlayingChange} 
          wavAvailable={wavAvailable} 
          mp3Size={mp3Size} 
          wavSize={wavSize}
          error={error}
        />
        
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">{t.studio.previewHint}</p>
        </div>
      </div>
    </div>
  );
});
