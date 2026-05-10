"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/shared/i18n";

interface RevokeConfirmModalProps {
  show: string | null;
  onClose: () => void;
  onRevoke: () => Promise<void>;
}

export function RevokeConfirmModal({ show, onClose, onRevoke }: RevokeConfirmModalProps) {
  const t = useT();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 /80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="aether-glass-wrapper rounded-[24px] max-w-sm w-full shadow-2xl border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aether-glass p-8 bg-red-950/10">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-red-400 mb-4 flex items-center gap-3">
                <span className="w-4 h-[1px] bg-red-500/50"></span>
                {t.apiKeys.securityWarning}
              </h2>
              <p className="font-light text-sm text-[#F4F4F5] mb-6 leading-relaxed">
                {t.apiKeys.revokeConfirmMsg}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-[8px] bg-white/5 border border-white/10 text-[10px] font-medium uppercase tracking-widest text-[#D4D4D8] hover:bg-white/10 transition-colors"
                >
                  {t.apiKeys.keep}
                </button>
                <button
                  onClick={onRevoke}
                  className="flex-1 py-2.5 rounded-[8px] bg-red-500/20 border border-red-500/50 text-[10px] font-medium uppercase tracking-widest text-red-400 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-colors"
                >
                  {t.apiKeys.confirmRevoke}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
