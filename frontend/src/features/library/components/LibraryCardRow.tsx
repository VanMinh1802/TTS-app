'use client';
import { motion } from 'framer-motion';
import { LibraryRecord, getRecordDuration } from '../types';
import { VoiceBadge } from '@/features/voice/components/VoiceBadge';
import type { VoiceInfo } from '@/features/voice/hooks/useVoiceMap';
import { useT } from "@/shared/i18n";

interface Props {
  record: LibraryRecord;
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  isPlaying: boolean;
  isPro: boolean;
  getVoice?: (id: string) => VoiceInfo;
}

const iconSvg = 'data:image/svg+xml,...'; // placeholder

export function LibraryCardRow({ record, onPlay, onDelete, onDownload, onUploadToCloud, isPlaying, isPro, getVoice }: Props) {
  const t = useT();
  return (
    <motion.div
      className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-[#6366F1]/[0.02] transition-all duration-200 group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <button
        onClick={() => onPlay(record)}
        className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-[0.92] ${
          isPlaying
            ? 'bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
            : 'border border-white/10 text-[#A1A1AA] hover:text-[#D4D4D8] hover:border-white/20 hover:bg-white/5'
        }`}
      >
        {isPlaying ? (
          <span className="text-sm font-bold">II</span>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-light leading-relaxed text-[#D4D4D8] truncate group-hover:text-white transition-colors">
          {record.text_content}
        </p>
      </div>

      <div className="shrink-0 w-28 text-right">
        <VoiceBadge voiceId={record.voice_id} getVoice={getVoice} />
      </div>

      <div className="shrink-0 w-14 text-center">
        <span className="text-xs font-light text-[#A1A1AA]">
          {getRecordDuration(record) != null ? `${getRecordDuration(record)!.toFixed(1)}s` : '--'}
        </span>
      </div>

      <div className="shrink-0 w-24 text-right">
        <span className="text-[11px] font-light tracking-wider text-[#71717A]">
          {new Date(record.created_at).toLocaleDateString('vi-VN')}
        </span>
      </div>

      <div className="shrink-0 w-24 text-right">
        <div className="flex gap-2 justify-end">
          {record.sync_status.local && (
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#818CF8] bg-[#6366F1]/10 border border-[#818CF8]/30 rounded-full px-2 py-0.5 shadow-[0_0_6px_rgba(99,102,241,0.1)]">
              L
            </span>
          )}
          {record.sync_status.cloud && (
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#C968F7] bg-[#C968F7]/10 border border-[#C968F7]/30 rounded-full px-2 py-0.5 shadow-[0_0_6px_rgba(201,104,247,0.1)]">
              C
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 w-[104px] flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => onDownload(record)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-white/5 transition-all duration-200 active:scale-[0.92]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
        {isPro && !record.sync_status.cloud && onUploadToCloud && (
          <button
            onClick={() => onUploadToCloud(record)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-[#818CF8] hover:bg-[#6366F1]/10 transition-all duration-200 active:scale-[0.92]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onDelete(record.id)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 active:scale-[0.92]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
