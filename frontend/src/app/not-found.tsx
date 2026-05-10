"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] flex items-center justify-center p-4 relative text-[#F4F4F5] font-light overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)' }} />

      <div className="text-center relative z-10">
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className="text-[120px] md:text-[180px] leading-none font-bold tracking-tighter bg-gradient-to-r from-[#6366F1] to-[#C968F7] bg-clip-text text-transparent"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-6 bg-gradient-to-r from-transparent to-[#6366F1]/50" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6366F1] font-bold">Lỗi</span>
            <div className="h-px w-6 bg-gradient-to-l from-transparent to-[#6366F1]/50" />
          </div>
          <h2 className="text-lg font-light text-[#A1A1AA] uppercase tracking-widest">
            Trang không tìm thấy
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[#71717A] mb-10 max-w-md mx-auto leading-relaxed"
        >
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. 
          Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <Link href="/dashboard">
            <button className="aether-btn aether-btn-primary px-8 py-3">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
                Về trang chủ
              </span>
            </button>
          </Link>

          <div className="flex items-center gap-6 mt-2">
            <Link href="/studio" className="text-[10px] uppercase tracking-widest font-bold text-[#71717A] hover:text-[#818CF8] transition-colors border-b border-transparent hover:border-[#818CF8]/30 pb-0.5">
              Studio
            </Link>
            <Link href="/voices" className="text-[10px] uppercase tracking-widest font-bold text-[#71717A] hover:text-[#818CF8] transition-colors border-b border-transparent hover:border-[#818CF8]/30 pb-0.5">
              Voices
            </Link>
            <Link href="/api-keys" className="text-[10px] uppercase tracking-widest font-bold text-[#71717A] hover:text-[#818CF8] transition-colors border-b border-transparent hover:border-[#818CF8]/30 pb-0.5">
              API Keys
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12"
        >
          <span className="inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/5 border border-[#22C55E]/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E]" />
            Hệ thống đang hoạt động
          </span>
        </motion.div>
      </div>
    </div>
  );
}
