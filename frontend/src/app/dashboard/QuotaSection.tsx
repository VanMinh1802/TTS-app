"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";

interface QuotaStatus {
  tier: string;
  limits: {
    characters_per_month: number | null;
    storage_mb: number | null;
    api_calls_per_day: number | null;
  };
  usage: {
    characters_this_month: number;
    storage_used_mb: number;
    api_calls_today: number;
  };
  remaining: {
    characters: number | null;
    storage_mb: number | null;
    api_calls: number | null;
  };
  reset_at: string | null;
}

interface Props {
  quota: QuotaStatus | null;
  loading: boolean;
  formatDate: (iso: string | null) => string;
  getPercentage: (used: number, limit: number | null) => number;
}

export default function QuotaSection({ quota, loading, formatDate, getPercentage }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">

      {/* Quota Remaining Card */}
      <div className="lg:col-span-2">
        <FadeIn delay={0.3} className="h-full">
          <div className="aether-glass-wrapper h-full rounded-[24px]">
            <div className="aether-glass p-8 h-full flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-[18px] font-semibold tracking-wide text-white">Tổng quan Tài nguyên</h2>
                <span className="px-4 py-1.5 rounded-full border border-[#818CF8]/30 text-[#818CF8] text-[11px] font-bold tracking-widest uppercase bg-[#6366F1]/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  {loading ? "..." : quota?.tier === "pro" ? "Gói Chuyên Nghiệp" : "Gói Cơ Bản"}
                </span>
              </div>

              <div className="space-y-8 flex-1">
                {/* Characters */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.1em] mb-2 text-[#A1A1AA]">
                    <span>Ký tự / Tháng</span>
                    <span className="text-white">
                      {loading ? "..." : `${quota?.usage.characters_this_month.toLocaleString()} / ${quota?.limits.characters_per_month?.toLocaleString() || "∞"}`}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getPercentage(quota?.usage.characters_this_month || 0, quota?.limits.characters_per_month || 0)}%` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] shadow-[0_0_15px_#818CF8]"
                    />
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.1em] mb-2 text-[#A1A1AA]">
                    <span>Dung lượng lưu trữ</span>
                    <span className="text-white">
                      {loading ? "..." : `${quota?.usage.storage_used_mb} / ${quota?.limits.storage_mb || "∞"} MB`}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getPercentage(quota?.usage.storage_used_mb || 0, quota?.limits.storage_mb || 0)}%` }}
                      transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] shadow-[0_0_15px_#818CF8]"
                    />
                  </div>
                </div>

                {/* API Calls */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.1em] mb-2 text-[#A1A1AA]">
                    <span>API Calls / Ngày</span>
                    <span className="text-white">
                      {loading ? "..." : `${quota?.usage.api_calls_today} / ${quota?.limits.api_calls_per_day || "∞"}`}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getPercentage(quota?.usage.api_calls_today || 0, quota?.limits.api_calls_per_day || 0)}%` }}
                      transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C968F7] to-[#D8B4E2] shadow-[0_0_15px_#C968F7]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#71717A]">
                  Làm mới: {loading ? "..." : formatDate(quota?.reset_at || null)}
                </span>
                <Link href="/pricing">
                  <button className="aether-btn aether-btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest">
                    Nâng cấp Pro
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Action Button */}
      <div className="lg:col-span-1">
        <FadeIn delay={0.4} className="h-full">
          <Link href="/studio" className="block h-full group">
            <div className="aether-glass-wrapper h-full rounded-[24px] transition-transform duration-500 group-hover:-translate-y-2">
              <div className="aether-glass p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-500">
                {/* Subtle hover glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#6366F1]/0 to-[#6366F1]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-14 h-14 rounded-full border border-[#818CF8]/30 bg-[#6366F1]/10 flex items-center justify-center mb-4 relative z-10 group-hover:border-[#818CF8]/60 group-hover:bg-[#6366F1]/20 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-500">
                  <svg className="w-6 h-6 text-[#818CF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h2 className="text-[20px] font-semibold tracking-wide text-white mb-1 relative z-10 group-hover:text-[#818CF8] transition-colors">TTS Studio</h2>
                <p className="text-[11px] font-medium tracking-widest uppercase text-[#A1A1AA] relative z-10">Tổng hợp Âm thanh</p>
              </div>
            </div>
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
