"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useT } from "@/shared/i18n";
import { UiChip } from "@/components/ui/ui-kit";
import { AudioPreview } from "./AudioPreview";
import type { NormalizationMeta } from "@/features/voice/types/voice-types";

export const PreviewPanel = React.memo(function PreviewPanel({ audioUrl, onCopy, onDownload, loading, normMeta, progress, autoPlay, wavAvailable, mp3Size, wavSize }: { audioUrl: string | null; onCopy: () => Promise<void>; onDownload: (format: 'mp3' | 'wav') => void; loading: boolean; normMeta: NormalizationMeta | null; progress: number; autoPlay?: boolean; wavAvailable: boolean; mp3Size?: number; wavSize?: number; }) {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(false);
  const handlePlayingChange = useCallback((playing: boolean) => setIsPlaying(playing), []);
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[18px] font-semibold tracking-wide text-white">{t.studio.previewTitle}</h2>
          <UiChip className={audioUrl ? "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20" : "bg-transparent border-[#333333] text-[#71717A] shadow-none"}>
            {audioUrl ? t.studio.ready : loading ? t.studio.generating : t.studio.waiting}
          </UiChip>
        </div>
        {/* Waveform when playing audio */}
        {isPlaying && (
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
        <AudioPreview audioUrl={audioUrl} loading={loading} onCopy={onCopy} onDownload={onDownload} progress={progress} autoPlay={autoPlay} onPlayingChange={handlePlayingChange} wavAvailable={wavAvailable} mp3Size={mp3Size} wavSize={wavSize} />
        
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">{t.studio.previewHint}</p>
          
          {normMeta && (
            <div 
              className={`flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
                normMeta.llm_status === 'success' 
                  ? 'border-[#6366F1]/30 bg-[#6366F1]/10 text-[#6366F1]' 
                  : normMeta.llm_status === 'skipped'
                  ? 'border-[#333333] bg-transparent text-[#71717A]'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
              title={normMeta.llm_status === 'success' ? "Hệ thống phát hiện văn bản phức tạp và đã gọi Gemini API để chuẩn hóa." : normMeta.text_was_complex ? "Văn bản phức tạp nhưng API Key lỗi. Fallback về rules." : "Văn bản tiêu chuẩn, xử lý nhanh bằng Rules."}
            >
              {normMeta.llm_status === 'success' ? (
                 <><span className="text-[12px] text-[#6366F1]">✨</span> AI Đã chuẩn hóa</>
              ) : normMeta.llm_status === 'skipped' ? (
                 <><span className="text-[12px]">⚡</span> Xử lý tiêu chuẩn</>
              ) : (
                 <><span className="text-[12px]">⚠️</span> API Lỗi - Đọc thô</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
