"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/shared/i18n";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const t = useT();
  const cfmLabel = confirmLabel ?? t.common.confirm;
  const cclLabel = cancelLabel ?? t.common.cancel;
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="aether-glass-wrapper rounded-[24px] max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`aether-glass p-8 ${isDanger ? "bg-red-950/10 border-red-500/30" : ""}`}>
              <h2 className={`text-[10px] font-medium uppercase tracking-[0.2em] mb-4 flex items-center gap-3 ${
                isDanger ? "text-red-400" : "text-[#818CF8]"
              }`}>
                <span className={`w-4 h-[1px] ${isDanger ? "bg-red-500/50" : "bg-[#818CF8]/50"}`}></span>
                {title}
              </h2>
              <p className="font-light text-sm text-[#F4F4F5] mb-6 leading-relaxed">
                {message}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-[8px] bg-white/5 border border-white/10 text-[10px] font-medium uppercase tracking-widest text-[#D4D4D8] hover:bg-white/10 transition-colors"
                >
                  {cclLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 rounded-[8px] text-[10px] font-medium uppercase tracking-widest transition-colors ${
                    isDanger
                      ? "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : "aether-btn aether-btn-primary"
                  }`}
                >
                  {cfmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
