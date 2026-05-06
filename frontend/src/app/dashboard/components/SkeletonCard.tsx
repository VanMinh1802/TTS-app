'use client';
import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="aether-glass-wrapper rounded-[24px] h-full">
      <div className="aether-glass p-8 h-full flex flex-col justify-between overflow-hidden">
        <div className="space-y-4">
          <motion.div
            className="h-3 w-24 rounded-full"
            style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))' }}
            animate={{ x: [-80, 80] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="h-8 w-32 rounded-lg"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))' }}
            animate={{ x: [-60, 60] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
