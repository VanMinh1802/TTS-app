"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/shared/i18n";

interface NewKeyData {
  name: string;
  fullKey: string;
}

interface NewKeyResultModalProps {
  keyData: NewKeyData | null;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function NewKeyResultModal({ keyData, onClose, onCopy }: NewKeyResultModalProps) {
  const t = useT();
  return (
    <AnimatePresence>
      {keyData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 /90 backdrop-blur-md flex items-center justify-center z-[60] p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="aether-glass-wrapper rounded-[24px] max-w-lg w-full shadow-2xl border-[#6366F1]/30"
          >
            <div className="aether-glass p-8">
              <div className="w-16 h-16 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/></svg>
              </div>

              <h2 className="text-xl font-light text-center mb-2">{t.apiKeys.createdHeading}</h2>
              <p className="text-sm text-[#D4D4D8] text-center mb-8 font-light">{t.apiKeys.copyNowWarning}</p>

              <div className="bg-black/40 rounded-[16px] border border-white/10 p-4 mb-8 group relative">
                <code className="block font-mono text-[13px] text-[#6366F1] break-all pr-10">{keyData.fullKey}</code>
                <button
                  onClick={() => onCopy(keyData.fullKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-white/5 hover:bg-white/10 text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-[16px] bg-[#6366F1]/20 border border-[#6366F1]/50 text-xs font-medium uppercase tracking-[0.2em] text-[#F4F4F5] hover:bg-[#6366F1]/30 transition-all"
              >
                {t.apiKeys.iSaved}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
