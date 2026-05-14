"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useT } from "@/shared/i18n";
import { UiChip } from "@/components/ui/ui-kit";
import { AudioPreview } from "./AudioPreview";
import type { StreamingStatus } from "@/features/tts/hooks/useTtsGenerate";

export const PreviewPanel = React.memo(function PreviewPanel({ 
  audioUrl, onCopy, onDownload, loading, progress, autoPlay, wavAvailable, mp3Size, wavSize, error,
  streamingStatus, streamingProgress,
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

        {/* Streaming progress indicator */}
        {streamingStatus === 'streaming' && streamingProgress && (
          <div className="mb-3">
            <p className="text-xs text-[#D4D4D8] text-center font-medium mb-2">
              Đoạn {streamingProgress.current}/{streamingProgress.total} — Đang nghe...
            </p>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#C968F7] to-[#6366F1] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(streamingProgress.current / streamingProgress.total) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Library save notifications */}
        {streamingStatus === 'saving' && (
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="animate-spin h-3.5 w-3.5 border-2 border-[#F59E0B] border-t-transparent rounded-full" />
            <p className="text-xs text-[#F59E0B] font-medium">Đang lưu vào Library...</p>
          </div>
        )}
        {streamingStatus === 'saved' && savedVisible && (
          <motion.div
            className="mb-3 flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-4 h-4 text-[#22C55E]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p className="text-xs text-[#22C55E] font-medium">Đã lưu vào Library</p>
          </motion.div>
        )}
        {streamingStatus === 'save-failed' && (
          <div className="mb-3 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-red-400 font-medium">Lưu thất bại</p>
          </div>
        )}

        {/* Waveform animation during streaming or playback */}
        {(isPlaying || streamingStatus === 'streaming') && (
          <div className="flex items-center justify-center gap-[3px] h-12 mb-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-[#C968F7]"
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
          </div>
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
