'use client';
import { motion } from 'framer-motion';
import { LibraryRecord } from '../types';
import { LibraryCardRow } from './LibraryCardRow';
import type { VoiceInfo } from '@/features/voice/hooks/useVoiceMap';

interface Props {
  records: LibraryRecord[];
  onPlay: (record: LibraryRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (record: LibraryRecord) => void;
  onUploadToCloud?: (record: LibraryRecord) => void;
  playingId: string | null;
  isPro: boolean;
  getVoice?: (id: string) => VoiceInfo;
}

const container = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export function LibraryList({ records, onPlay, onDelete, onDownload, onUploadToCloud, playingId, isPro, getVoice }: Props) {
  if (records.length === 0) return null;

  return (
    <div className="aether-glass-wrapper rounded-[24px] mt-4 overflow-x-auto">
      <div className="aether-glass rounded-[24px] overflow-hidden min-w-[640px]">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06]">
          <div className="w-11 shrink-0" />
          <div className="flex-1 min-w-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Nội dung</div>
          <div className="shrink-0 w-28 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Giọng đọc</div>
          <div className="shrink-0 w-14 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">T.gian</div>
          <div className="shrink-0 w-24 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Ngày</div>
          <div className="shrink-0 w-24 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Trạng thái</div>
          <div className="shrink-0 w-[104px]" />
        </div>

        <motion.div variants={container} initial="initial" animate="animate">
          {records.map((record) => (
            <LibraryCardRow
              key={record.id}
              record={record}
              onPlay={onPlay}
              onDelete={onDelete}
              onDownload={onDownload}
              onUploadToCloud={onUploadToCloud}
              isPlaying={playingId === record.id}
              isPro={isPro}
              getVoice={getVoice}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
