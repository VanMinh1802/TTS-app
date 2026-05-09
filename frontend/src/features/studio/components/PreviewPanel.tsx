"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useT } from "@/shared/i18n";
import { UiChip } from "@/components/ui/ui-kit";
import { AudioPreview } from "./AudioPreview";

export const PreviewPanel = React.memo(function PreviewPanel({ 
  audioUrl, onCopy, onDownload, loading, progress, autoPlay, wavAvailable, mp3Size, wavSize 
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
}) {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(false);
  const handlePlayingChange = useCallback((playing: boolean) => setIsPlaying(playing), []);
  
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-[18px] font-semibold tracking-wide text-white">{t.previewTitle}</h2>
          <UiChip className={audioUrl ? "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20" : "bg-transparent border-[#333333] text-[#71717A] shadow-none"}>
            {audioUrl ? t.ready : loading ? t.generating : t.waiting}
          </UiChip>
        </div>
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
        />
        
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">{t.previewHint}</p>
        </div>
      </div>
    </div>
  );
});
