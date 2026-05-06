"use client";

import type { DictionaryEntry } from "./CustomDictionary";
import { useT } from "@/shared/i18n";
import { motion } from "framer-motion";

interface Props {
  entry: DictionaryEntry;
  index: number;
  isNewest: boolean;
  editingIndex: number | null;
  editForm: DictionaryEntry;
  setEditForm: React.Dispatch<React.SetStateAction<DictionaryEntry>>;
  onStartEdit: (index: number, entry: DictionaryEntry) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRemove: (index: number) => void;
  hasEdit: boolean;
}

export function DictionaryEntryRow({
  entry,
  index,
  isNewest,
  editingIndex,
  editForm,
  setEditForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
  hasEdit,
}: Props) {
  const t = useT();
  const isEditing = editingIndex === index;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group border-b border-white/[0.04] last:border-none"
    >
      <div className={`px-6 ${isEditing ? 'py-5 bg-[#6366F1]/[0.02]' : 'py-4 hover:bg-white/[0.02]'} transition-colors`}>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8]">Từ</span>
                <input
                  value={editForm.word}
                  onChange={(e) => setEditForm(f => ({ ...f, word: e.target.value }))}
                  className="w-full rounded-xl border border-[#818CF8]/30 bg-black/40 px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[#818CF8] focus:shadow-[0_0_12px_rgba(129,140,248,0.15)] shadow-inner transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8]">Cách đọc</span>
                <input
                  value={editForm.pronunciation}
                  onChange={(e) => setEditForm(f => ({ ...f, pronunciation: e.target.value }))}
                  className="w-full rounded-xl border border-[#818CF8]/30 bg-black/40 px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[#818CF8] focus:shadow-[0_0_12px_rgba(129,140,248,0.15)] shadow-inner transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Left: word + pronunciation */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-semibold tracking-tight text-white truncate">{entry.word}</span>
                <svg className="w-3.5 h-3.5 shrink-0 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-[14px] font-medium text-[#D4D4D8] bg-white/[0.04] px-3 py-0.5 rounded-lg border border-white/5 truncate">{entry.pronunciation}</span>
                {isNewest && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    MỚI
                  </motion.span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {hasEdit && (
                <button
                  type="button"
                  onClick={() => onStartEdit(index, entry)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#818CF8] hover:bg-[#6366F1]/10 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
