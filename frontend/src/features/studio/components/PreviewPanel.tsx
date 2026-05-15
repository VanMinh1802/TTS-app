"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from "@/shared/i18n";
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
  const handlePlayingChange = useCallback((playing: boolean) => setIsPlaying(playing), []);
  
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[18px] font-semibold tracking-wide text-white">{t.studio.previewTitle}</h2>
        </div>

        <AnimatePresence mode="wait">
          {(loading || streamingStatus === 'streaming' || streamingStatus === 'saving') ? (
            <motion.div
              key="unified-generating-box"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-32 mb-4 flex flex-col justify-between p-4 border border-[#6366F1]/20 border-dashed rounded-[16px] bg-[#6366F1]/5 relative overflow-hidden"
            >
              {/* Top part: Live Preview Controls */}
              <div className="flex items-center justify-between relative z-10 w-full">
                <div className="flex items-center gap-3">
                  {streamingStatus === 'streaming' ? (
                    <button
                      onClick={onTogglePreview}
                      className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-[#C968F7]/15 hover:bg-[#C968F7]/25 border border-[#C968F7]/30 transition-all shadow-[0_0_10px_rgba(201,104,247,0.2)]"
                    >
                      {isPreviewPlaying ? (
                        <svg className="w-4 h-4 text-[#C968F7]" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-[#C968F7] ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>
                  ) : streamingStatus === 'saving' ? (
                    <div className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                      <span className="animate-spin h-4 w-4 border-2 border-[#F59E0B] border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </motion.div>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <p className="text-[13px] font-bold text-white tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      {streamingStatus === 'streaming' 
                        ? streamingProgress?.current === 0 ? 'Đang chuẩn bị âm thanh...' : 'Live Preview'
                        : streamingStatus === 'saving' ? 'Đang lưu vào thư viện...' : 'Đang xử lý nội dung...'}
                    </p>
                    {progress === 100 && streamingStatus === 'streaming' && isPreviewPlaying && (
                      <p className="text-[10px] text-[#A1A1AA] font-medium mt-0.5 animate-pulse">Bấm dừng để tải xuống ngay</p>
                    )}
                  </div>
                </div>

                {/* Right: Waveform */}
                <div className="flex items-center gap-[3px] h-8">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const isActuallyPlaying = isPreviewPlaying && (streamingProgress?.current ?? 0) > 0;
                    return (
                      <motion.span
                        key={i}
                        className="w-[2.5px] rounded-full bg-[#C968F7]"
                        animate={{
                          height: isActuallyPlaying ? [4, 12 + Math.sin(i * 1.5) * 12, 4, 16, 4] : 3,
                          opacity: isActuallyPlaying ? [0.4, 1, 0.5, 0.8, 0.4] : 0.2,
                        }}
                        transition={{
                          height: { duration: 0.6 + i * 0.04, repeat: Infinity, repeatType: 'mirror' },
                          opacity: { duration: 0.8 + i * 0.05, repeat: Infinity, repeatType: 'mirror' },
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom part: Overall Generation Progress */}
              <div className="w-full mt-auto relative z-10 bg-black/20 p-3 rounded-[12px] border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-medium">Tiến độ tổng thể</span>
                  <span className="text-[10px] text-[#6366F1] font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#6366F1] to-[#C968F7]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="completed-player"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              {/* Standalone Waveform for Static Playback */}
              {isPlaying && (
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
                loading={false} 
                onCopy={onCopy} 
                onDownload={onDownload} 
                progress={100} 
                autoPlay={autoPlay} 
                onPlayingChange={(playing) => setIsPlaying(playing)} 
                wavAvailable={wavAvailable} 
                mp3Size={mp3Size} 
                wavSize={wavSize}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!(loading || streamingStatus === 'streaming' || streamingStatus === 'saving') && (
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">{t.studio.previewHint}</p>
          </div>
        )}
      </div>
    </div>
  );
});
