"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UiButton } from "@/components/ui/ui-kit";
import { callGemini, GRAMMAR_FIX_PROMPT } from "@/lib/gemini";

interface ChangeEntry {
  before: string;
  after: string;
  reason: string;
}

interface GrammarResult {
  corrected: string;
  changes: ChangeEntry[];
}

interface Props {
  text: string;
  onApply: (corrected: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const GrammarFixModal = ({ text, onApply, onClose, isOpen }: Props) => {
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  const runFix = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissingKey(false);
    const res = await callGemini(GRAMMAR_FIX_PROMPT, text);
    if (res.success && res.data) {
      setResult(res.data as unknown as GrammarResult);
    } else {
      setError(res.error ?? "Không thể sửa ngữ pháp.");
      if (res.code === 'MISSING_KEY') setMissingKey(true);
    }
    setLoading(false);
  }, [text]);

  useEffect(() => {
    if (isOpen && text) {
      runFix();
    }
  }, [isOpen, text, runFix]);

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
                          <span className="text-[var(--color-meridian-primary)]">📝</span> Sửa ngữ pháp
                        </h2>
                        <p className="mt-1 text-xs font-light text-[#D4D4D8]">
                          AI sẽ kiểm tra và sửa lỗi chính tả, ngữ pháp
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
                            <p className="text-sm font-light text-[#A1A1AA]">Đang kiểm tra ngữ pháp...</p>
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

                      {!loading && !error && result && (
                        <div className="space-y-6">
                          {result.changes.length === 0 && (
                            <div className="rounded-[12px] border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400 text-center">
                              Văn bản không có lỗi chính tả.
                            </div>
                          )}
                          <div className="rounded-[12px] border border-white/5 bg-white/[0.02] p-5">
                            <label className="text-[10px] font-light uppercase tracking-widest text-[#A1A1AA]">Bản gốc</label>
                            <p className="mt-2 text-sm font-light text-[#D4D4D8] line-through decoration-red-400/60">
                              {result.changes.length === 0 ? text : text}
                            </p>
                          </div>
                          <div className="rounded-[12px] border border-green-500/20 bg-green-500/5 p-5">
                            <label className="text-[10px] font-light uppercase tracking-widest text-green-400">Đã sửa</label>
                            <p className="mt-2 text-sm font-light text-green-300">
                              {result.corrected}
                            </p>
                          </div>

                          {result.changes.length > 0 && (
                            <div>
                              <label className="text-[10px] font-light uppercase tracking-widest text-[#A1A1AA]">
                                Chi tiết thay đổi ({result.changes.length})
                              </label>
                              <div className="mt-3 space-y-2">
                                {result.changes.map((change, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                                    className="rounded-[10px] border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center gap-3"
                                  >
                                    <span className="text-sm font-mono text-red-400 line-through">{change.before}</span>
                                    <span className="text-[#A1A1AA]">→</span>
                                    <span className="text-sm font-mono text-green-400">{change.after}</span>
                                    <span className="ml-auto text-xs font-light text-[#71717A]">{change.reason}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 bg-[#050604]/50 p-6 flex justify-end gap-3 rounded-b-[16px]">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-light text-[#D4D4D8] hover:text-white transition-colors"
                      >
                        Hủy
                      </button>
                      <UiButton
                        onClick={() => result && onApply(result.corrected)}
                        disabled={!result}
                      >
                        Áp dụng
                      </UiButton>
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
