'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { LibraryRecord, getRecordDuration } from '../types';

interface Props {
  record: LibraryRecord;
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  isPlaying: boolean;
  isPro: boolean;
}

const AudioWaveform = React.memo(function AudioWaveform({ active }: { active: boolean }) {
  const bars = [4, 6, 9, 6, 12, 7, 10, 5, 8, 6, 4, 8, 5, 7];
  return (
    <div className="flex items-center justify-center gap-[3px]">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: '#C968F7' }}
          animate={active ? {
            height: [h * 0.3, h, h * 0.3],
            opacity: [0.4, 1, 0.4],
          } : {
            height: 3,
            opacity: 0.4,
          }}
          transition={active ? {
            height: { duration: 0.5 + i * 0.04, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
            opacity: { duration: 0.7 + i * 0.06, repeat: Infinity, repeatType: 'mirror' },
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
});

export function LibraryCard({ record, onPlay, onDelete, onDownload, onUploadToCloud, isPlaying, isPro }: Props) {
  return (
    <motion.div
      className="aether-glass-wrapper rounded-[24px] transition-all duration-300 hover:-translate-y-1"
      layout
    >
      <div className="aether-glass rounded-[24px] overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div
          className="h-28 flex items-center justify-center cursor-pointer relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(201,104,247,0.15))',
          }}
          onClick={() => onPlay(record)}
        >
          {/* Ambient glow */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: isPlaying ? 0.4 : 0 }}
            style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.2), transparent)' }}
            transition={{ duration: 0.5 }}
          />

          {isPlaying ? (
            <div className="relative z-10 w-full max-w-[140px]">
              <AudioWaveform active={isPlaying} />
            </div>
          ) : (
            <motion.div
              className="relative z-10 w-12 h-12 rounded-full border border-[#818CF8]/30 bg-[#6366F1]/10 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              whileHover={{ scale: 1.08, borderColor: 'rgba(129,140,248,0.6)', background: 'rgba(99,102,241,0.15)' }}
              whileTap={{ scale: 0.92 }}
            >
              <svg className="w-5 h-5 text-[#818CF8] ml-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 flex flex-col flex-1">
          {/* Meta row */}
          <div className="flex items-center justify-between">
            <span className="aether-badge text-[10px] tracking-[0.15em] px-3 py-1">
              {record.voice_id}
            </span>
            <span className="text-[11px] font-light tracking-wider text-[#A1A1AA]">
              {getRecordDuration(record) != null ? `${getRecordDuration(record)!.toFixed(1)}s` : '--'}
            </span>
          </div>

          {/* Text */}
          <p className="text-sm font-light leading-relaxed text-[#D4D4D8] line-clamp-2">
            {record.text_content}
          </p>

          {/* Status + Date */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-2">
              {record.sync_status.local && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-[#818CF8] bg-[#6366F1]/10 border border-[#818CF8]/30 rounded-full px-2.5 py-0.5 shadow-[0_0_8px_rgba(99,102,241,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] shadow-[0_0_6px_#6366F1]" />
                  Local
                </span>
              )}
              {record.sync_status.cloud && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-[#C968F7] bg-[#C968F7]/10 border border-[#C968F7]/30 rounded-full px-2.5 py-0.5 shadow-[0_0_8px_rgba(201,104,247,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C968F7] shadow-[0_0_6px_#C968F7]" />
                  Cloud
                </span>
              )}
            </div>
            <span className="text-[10px] font-light tracking-wider text-[#71717A]">
              {new Date(record.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(record); }}
              className={`flex-[2] flex items-center justify-center gap-2 py-3 text-xs font-medium tracking-wider uppercase rounded-full transition-all duration-200 active:scale-[0.97] min-h-[44px] ${
                isPlaying
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : 'bg-white/5 text-[#D4D4D8] border border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                {isPlaying ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                )}
              </svg>
              {isPlaying ? 'Tạm dừng' : 'Phát'}
            </button>

            <button
              onClick={() => onDownload(record)}
              className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-white/5 hover:border-white/20 transition-all duration-200 active:scale-[0.92]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>

            {isPro && !record.sync_status.cloud && onUploadToCloud && (
              <button
                onClick={() => onUploadToCloud(record)}
                className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:text-[#818CF8] hover:border-[#818CF8]/30 hover:bg-[#6366F1]/10 transition-all duration-200 active:scale-[0.92]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </button>
            )}

            <button
              onClick={() => onDelete(record.id)}
              className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all duration-200 active:scale-[0.92]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
