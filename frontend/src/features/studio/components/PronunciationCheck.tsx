"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UiButton } from "@/components/ui/ui-kit";
import { callGemini, PRONUNCIATION_CHECK_PROMPT } from "@/lib/gemini";

interface TermEntry {
  word: string;
  pronunciation: string;
  reason: string;
}

interface Props {
  text: string;
  onAddToDictionary: (entry: { word: string; pronunciation: string }) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const PronunciationCheck = ({ text, onAddToDictionary, onClose, isOpen }: Props) => {
  const [terms, setTerms] = useState<TermEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [missingKey, setMissingKey] = useState(false);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissingKey(false);
    const result = await callGemini(PRONUNCIATION_CHECK_PROMPT, text);
    if (result.success && result.data?.terms) {
      setTerms(result.data.terms as TermEntry[]);
    } else {
      setError(result.error ?? "Không thể kiểm tra phát âm.");
      if (result.code === 'MISSING_KEY') setMissingKey(true);
    }
    setLoading(false);
  }, [text]);

  useEffect(() => {
    if (isOpen && text) {
      runCheck();
    }
  }, [isOpen, text, runCheck]);

  const handleAdd = (term: TermEntry) => {
    onAddToDictionary({ word: term.word, pronunciation: term.pronunciation });
    setAddedWords((prev) => new Set(prev).add(term.word));
  };

  return typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100] bg-[#050604]/80 backdrop-blur-md"
              />
              <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="pointer-events-auto w-full max-w-2xl overflow-hidden aether-glass-wrapper"
                >
                  <div className="aether-glass w-full h-full flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 p-6">
                      <div>
                        <h2 className="text-xl font-light tracking-wide text-[var(--color-meridian-neutral)] flex items-center gap-2">
                          <span className="text-[var(--color-meridian-primary)]">✨</span> Kiểm tra phát âm
                        </h2>
                        <p className="mt-1 text-xs font-light text-[#D4D4D8]">
                          AI sẽ tìm những từ khó phát âm trong văn bản
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="rounded-full p-2 text-[#D4D4D8] hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-6">
                      {loading && (
                        <div className="flex items-center justify-center py-16">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-meridian-primary)]/30 border-t-[var(--color-meridian-primary)]" />
                            <p className="text-sm font-light text-[#A1A1AA]">Đang phân tích...</p>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="rounded-[12px] border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                          <p>{error}</p>
                          {missingKey && (
                            <a href="/settings" className="mt-2 inline-block text-xs text-[#818CF8] hover:underline">
                              → Đi tới Cài đặt để nhập API Key
                            </a>
                          )}
                        </div>
                      )}

                      {!loading && !error && terms.length === 0 && (
                        <p className="text-center text-sm text-[#A1A1AA] py-8">
                          Không tìm thấy từ nào cần phiên âm.
                        </p>
                      )}

                      {!loading && !error && terms.length > 0 && (
                        <div className="space-y-4">
                          {terms.map((term, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                delay: idx * 0.08,
                                duration: 0.4,
                                ease: [0.23, 1, 0.32, 1],
                              }}
                              className="flex items-start gap-4 rounded-[12px] border border-white/5 bg-white/[0.02] hover:border-white/10 p-4 transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                            >
                              <div className="flex-1 space-y-2">
                                <div>
                                  <label className="text-[10px] font-light uppercase tracking-widest text-[#A1A1AA]">Từ</label>
                                  <div className="mt-1 font-mono text-sm font-light text-[var(--color-meridian-neutral)]">
                                    {term.word}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-light uppercase tracking-widest text-[#A1A1AA]">Cách đọc</label>
                                  <div className="mt-1 text-sm font-light text-[#D4D4D8]">{term.pronunciation}</div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-light uppercase tracking-widest text-[#A1A1AA]">Lý do</label>
                                  <div className="mt-1 text-sm font-light text-[#A1A1AA]">{term.reason}</div>
                                </div>
                              </div>
                              <div className="pt-1">
                                <UiButton
                                  variant="secondary"
                                  onClick={() => handleAdd(term)}
                                  disabled={addedWords.has(term.word)}
                                  className="text-xs px-3 py-1.5"
                                >
                                  {addedWords.has(term.word) ? "Đã thêm" : "Thêm vào từ điển"}
                                </UiButton>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 bg-[#050604]/50 p-6 flex justify-end gap-3 rounded-b-[16px]">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-light text-[#D4D4D8] hover:text-white transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )
    : null;
};
