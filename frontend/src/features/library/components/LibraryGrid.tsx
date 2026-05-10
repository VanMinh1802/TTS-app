'use client';
import { motion } from 'framer-motion';
import { LibraryRecord } from '../types';
import { LibraryCard } from './LibraryCard';
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
      staggerChildren: 0.06,
    },
  },
};

export function LibraryGrid({ records, onPlay, onDelete, onDownload, onUploadToCloud, playingId, isPro, getVoice }: Props) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-6"
      variants={container}
      initial="initial"
      animate="animate"
    >
      {records.map((record) => (
        <LibraryCard
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
  );
}
