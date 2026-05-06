"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UiButton } from "@/components/ui/ui-kit";
import { callGemini, SMART_CHUNKING_PROMPT } from "@/lib/gemini";

interface Chunk {
  text: string;
  label: string;
}

interface Props {
  text: string;
  onClose: () => void;
  isOpen: boolean;
  onChunksReady: (chunks: Array<{ text: string; label: string }>) => void;
}

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) + "..." : str;

export const SmartChunking = ({ text, onClose, isOpen, onChunksReady }: Props) => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  const runChunking = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissingKey(false);
    const result = await callGemini(SMART_CHUNKING_PROMPT, text);
    if (result.success && result.data?.chunks) {
      setChunks(result.data.chunks as Chunk[]);
    } else {
      setError(result.error ?? "Không thể chia đoạn.");
      if (result.code === 'MISSING_KEY') setMissingKey(true);
    }
    setLoading(false);
  }, [text]);

  useEffect(() => {
    if (isOpen && text) {
      runChunking();
    }
  }, [isOpen, text, runChunking]);

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
                          <span className="text-[var(--color-meridian-primary)]">✂️</span> Chia đoạn thông minh
                        </h2>
                        <p className="mt-1 text-xs font-light text-[#D4D4D8]">
                          AI sẽ chia văn bản thành các đoạn logic
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
                            <p className="text-sm font-light text-[#A1A1AA]">Đang phân tích và chia đoạn...</p>
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

                      {!loading && !error && chunks.length === 0 && (
                        <p className="text-center text-sm text-[#A1A1AA] py-8">
                          Không thể chia đoạn cho văn bản này.
                        </p>
                      )}

                      {!loading && !error && chunks.length > 0 && (
                        <div className="space-y-3">
                          {chunks.map((chunk, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                delay: idx * 0.08,
                                duration: 0.4,
                                ease: [0.23, 1, 0.32, 1],
                              }}
                              className="rounded-[12px] border border-white/5 bg-white/[0.02] hover:border-white/10 p-4 transition-all duration-300"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-meridian-primary)]/10 border border-[var(--color-meridian-primary)]/20 flex items-center justify-center text-xs font-medium text-[var(--color-meridian-primary)]">
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-medium text-[var(--color-meridian-neutral)]">
                                  {chunk.label}
                                </span>
                              </div>
                              <p className="text-sm font-light text-[#A1A1AA] leading-relaxed pl-10">
                                {truncate(chunk.text, 180)}
                              </p>
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
                        Hủy
                      </button>
                      <UiButton
                        onClick={() => onChunksReady(chunks)}
                        disabled={chunks.length === 0}
                      >
                        Xác nhận
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
