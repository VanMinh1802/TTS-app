'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { LibraryRecord } from '../types';

interface FormatPickerModalProps {
  show: boolean;
  onClose: () => void;
  record: LibraryRecord | null;
  mode: 'download' | 'upload';
  onChoose: (record: LibraryRecord, format: 'mp3' | 'wav') => void;
}

function formatSize(url: string | undefined): string {
  if (!url) return '';
  const b64 = url.split(',')[1] || '';
  const bytes = b64.length * 0.75;
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export function FormatPickerModal({
  show,
  onClose,
  record,
  mode,
  onChoose,
}: FormatPickerModalProps) {
  return (
    <AnimatePresence>
      {show && record && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0E0E14] border border-white/10 rounded-[20px] p-6 w-full max-w-sm"
          >
            <h3 className="text-sm font-light text-[#D4D4D8] mb-1">
              {mode === 'download' ? 'Chọn định dạng tải xuống' : 'Chọn định dạng tải lên'}
            </h3>
            <p className="text-[11px] text-[#A1A1AA] mb-5 font-light">
              {mode === 'download'
                ? 'Bạn muốn tải bản nén nhẹ hay bản gốc chất lượng cao?'
                : 'Bạn muốn lưu trữ bản nén tiết kiệm dung lượng hay bản gốc không nén?'}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => onChoose(record, 'mp3')}
                className="w-full flex items-center gap-4 p-4 rounded-[14px] border border-[var(--color-meridian-primary)]/20 bg-[var(--color-meridian-primary)]/5 hover:bg-[var(--color-meridian-primary)]/10 hover:border-[var(--color-meridian-primary)]/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-meridian-primary)]/10 flex items-center justify-center text-[var(--color-meridian-primary)] text-[11px] font-bold uppercase tracking-wider group-hover:scale-110 transition-transform">
                  MP3
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-light text-[#D4D4D8]">MP3 (nén)</div>
                  <div className="text-[11px] text-[#A1A1AA]">
                    Dung lượng nhỏ ~{formatSize(record.audio_mp3)} · Tải nhanh · Tiết kiệm
                  </div>
                </div>
              </button>

              <button
                onClick={() => onChoose(record, 'wav')}
                className="w-full flex items-center gap-4 p-4 rounded-[14px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#A1A1AA] text-[11px] font-bold uppercase tracking-wider group-hover:scale-110 transition-transform">
                  WAV
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-light text-[#D4D4D8]">WAV (lossless)</div>
                  <div className="text-[11px] text-[#A1A1AA]">
                    Chất lượng gốc ~{formatSize(record.audio_url)} · Không nén · Chất lượng cao
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 text-[11px] text-[#A1A1AA] hover:text-[#D4D4D8] font-light uppercase tracking-wider transition-colors"
            >
              Huỷ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
