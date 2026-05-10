'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from "@/shared/i18n";

interface Props {
  label: string;
  used: number;
  limit: number | null;
  unit: string;
  children: React.ReactNode;
}

export function ProgressTooltip({ label, used, limit, unit, children }: Props) {
  const t = useT();
  const [show, setShow] = useState(false);
  const pct = limit && limit > 0 ? Math.round((used / limit) * 100) : 0;

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="progress-tooltip absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] whitespace-nowrap bg-[rgba(10,10,15,0.97)] backdrop-blur-[12px]"
          >
            <p className="text-[10px] font-medium text-[#D4D4D8]">
              {t.dashboard.usedProgress
                .replace('{used}', used.toLocaleString())
                .replace('{limit}', limit?.toLocaleString() || '∞')
                .replace('{unit}', unit)
                .replace('{pct}', String(pct))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
