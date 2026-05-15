'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
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

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPreview({ audioUrl, loading, onDownload, onCopy, wavAvailable, mp3Size, wavSize, error, progress, autoPlay, onPlayingChange }: AudioPreviewProps) {
  const t = useT();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl]);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  }, [duration]);

  const [speedOpen, setSpeedOpen] = useState(false);
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleSpeedSet = useCallback((s: number) => {
    setSpeed(s);
    setSpeedOpen(false);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
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
            className="h-28 flex flex-col items-center justify-center border border-[#6366F1]/20 border-dashed rounded-[16px] bg-[#6366F1]/5"
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
              {progress < 30 ? t.studio.genProgressLoading : progress < 60 ? t.studio.genProgressSynthesizing : t.studio.genProgressFinishing} 
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
            className="aether-glass-wrapper rounded-[16px] w-full"
          >
            <div className="aether-glass rounded-[16px] p-4">
            <audio
              ref={audioRef}
              className="hidden"
              src={audioUrl}
              autoPlay={autoPlay}
              onPlay={() => { setIsPlaying(true); onPlayingChange?.(true); }}
              onPause={() => { setIsPlaying(false); onPlayingChange?.(false); }}
              onEnded={() => { setIsPlaying(false); onPlayingChange?.(false); }}
              onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            />

            {/* Custom Audio Player */}
            <div className="rounded-[14px] border border-[#6366F1]/20 bg-[#6366F1]/5 p-4 mt-2">
              {/* Seek Bar */}
              <div
                className="relative h-2 bg-white/8 rounded-full cursor-pointer group/seek mb-4"
                onClick={handleSeek}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6366F1] to-[#C968F7] rounded-full pointer-events-none transition-all duration-75"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
                  style={{ left: `calc(${progressPct}% - 7px)` }}
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 text-[#818CF8]" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[#818CF8] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  )}
                </button>

                {/* Time Display */}
                <span className="text-[11px] tabular-nums text-[#D4D4D8] min-w-[70px]">
                  {formatTime(currentTime)} <span className="text-[#71717A]">/ {formatTime(duration)}</span>
                </span>

                <div className="flex-1" />

                {/* Playback Speed */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSpeedOpen(v => !v)}
                    onBlur={() => setTimeout(() => setSpeedOpen(false), 150)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                      speed !== 1
                        ? 'text-[#818CF8] bg-[#6366F1]/15 border-[#6366F1]/30'
                        : 'text-[#A1A1AA] bg-white/5 border-white/8 hover:bg-white/10 hover:text-white'
                    }`}
                    title={t.studio.playbackSpeed}
                  >
                    {speed}x
                  </button>
                  {speedOpen && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[#1A1A2E] border border-white/10 rounded-[10px] shadow-xl py-1.5 min-w-[80px] z-50">
                      {SPEEDS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleSpeedSet(s); }}
                          className={`w-full px-4 py-2 text-left text-[11px] font-medium transition-colors ${
                            s === speed
                              ? 'text-[#818CF8] bg-[#6366F1]/10'
                              : 'text-[#D4D4D8] hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Volume */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#71717A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 accent-[#6366F1] cursor-pointer"
                    aria-label="Volume"
                  />
                </div>
              </div>
            </div>

            <div className={`mt-4 grid gap-3 ${wavAvailable ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button
                type="button"
                onClick={() => onDownload('mp3')}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-[12px] border border-[#6366F1]/30 bg-[#6366F1]/10 hover:bg-[#6366F1]/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                <svg className="w-5 h-5 text-[#818CF8] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                <span className="text-xs font-semibold text-[#D4D4D8] group-hover:text-white transition-colors">MP3</span>
                {mp3Size ? (
                  <span className="text-[10px] text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">~{Math.round(mp3Size / 1024)} KB</span>
                ) : null}
              </button>

              {wavAvailable && (
                <button
                  type="button"
                  onClick={() => onDownload('wav')}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-[12px] border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <svg className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                  <span className="text-xs font-semibold text-[#D4D4D8] group-hover:text-white transition-colors">WAV</span>
                  {wavSize ? (
                    <span className="text-[10px] text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">~{(wavSize / (1024 * 1024)).toFixed(1)} MB</span>
                  ) : (
                    <span className="text-[10px] text-[#6366F1]">lossless</span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onCopy}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-[12px] border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                <svg className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>
                </svg>
                <span className="text-xs font-semibold text-[#D4D4D8] group-hover:text-white transition-colors">{t.studio.copyLink}</span>
              </button>
            </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-36 flex flex-col items-center justify-center border border-[#6366F1]/20 border-dashed rounded-[16px] bg-[#6366F1]/5"
          >
            <div className={`mb-3 ${error ? 'text-red-400/60' : 'text-[#A1A1AA] opacity-50'}`}>
              {error ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
            </div>
            <p className={`font-light text-[10px] uppercase tracking-[0.2em] ${error ? 'text-red-400' : 'text-[#A1A1AA]'}`}>
              {error ? error : t.studio.noAudio}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}