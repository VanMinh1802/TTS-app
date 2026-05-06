"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@/features/auth";
import { notificationService } from "@/shared/notifications/notification-store";
import { CounterText } from "./components/CounterText";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { ProgressTooltip } from "./components/ProgressTooltip";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Chào buổi tối";
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const quotaData = await apiRequest<QuotaStatus>("/quota");
        setQuota(quotaData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        notificationService.notify({ severity: "error", title: "Lỗi", message: "Không thể tải thông tin quota. Vui lòng thử lại." });
      } finally {
        setLoading(false);
      }
    };
    fetchQuota();
  }, []);

  const greeting = getGreeting();

  const stats = [
    { label: "Ký tự đã dùng", value: quota?.usage.characters_this_month || 0 },
    { label: "API Calls hôm nay", value: quota?.usage.api_calls_today || 0 },
    { label: "Lưu trữ", value: quota?.usage.storage_used_mb || 0, suffix: " MB" },
  ];

  const progressRows = [
    { label: "Ký tự / Tháng", key: "characters", used: quota?.usage.characters_this_month || 0, limit: quota?.limits.characters_per_month ?? null, unit: "ký tự", color: "from-[#6366F1] to-[#818CF8]", glow: "#818CF8" },
    { label: "Dung lượng", key: "storage", used: quota?.usage.storage_used_mb || 0, limit: quota?.limits.storage_mb ?? null, unit: "MB", color: "from-[#C968F7] to-[#D8B4E2]", glow: "#C968F7" },
    { label: "API Calls / Ngày", key: "api", used: quota?.usage.api_calls_today || 0, limit: quota?.limits.api_calls_per_day ?? null, unit: "lượt", color: "from-[#22C55E] to-[#16A34A]", glow: "#22C55E" },
  ];

  const container = { animate: { transition: { staggerChildren: 0.08 } } };
  const item = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 min-h-screen pt-32">
      {/* Welcome */}
      <motion.div variants={container} initial="initial" animate="animate" className="mb-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl leading-tight py-0 font-bold text-white">
              {greeting}, <span className="bg-gradient-to-r from-[#818CF8] to-[#C968F7] bg-clip-text text-transparent">{user?.name || user?.email?.split("@")[0] || "..."}</span>
            </h1>
            <span className="aether-badge mt-2">{quota?.tier === "pro" ? "Gói Chuyên Nghiệp" : "Gói Cơ Bản"}</span>
          </div>
        </motion.div>

      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => <motion.div key={i} variants={item}><SkeletonCard /></motion.div>)}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <div className="aether-glass-wrapper rounded-[24px] h-full transition-transform duration-300 hover:-translate-y-1">
                <div className="aether-glass p-8 h-full flex flex-col justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-[#818CF8] mb-2">{stat.label}</p>
                  <CounterText
                    value={stat.value}
                    suffix={stat.suffix || ""}
                    className="text-[24px] sm:text-[28px] md:text-[32px] font-bold tracking-tight text-white"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Progress + Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div variants={container} initial="initial" animate="animate" className="lg:col-span-2">
          <motion.div variants={item}>
            <div className="aether-glass-wrapper rounded-[24px] h-full">
              <div className="aether-glass p-8 h-full flex flex-col">
                <h2 className="text-[18px] font-semibold tracking-wide text-white mb-8">Tổng quan Tài nguyên</h2>
                <div className="space-y-6 flex-1">
                  {progressRows.map((row) => (
                    <ProgressTooltip key={row.key} label={row.label} used={row.used} limit={row.limit} unit={row.unit}>
                      <div>
                        <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.1em] mb-2 text-[#A1A1AA]">
                          <span>{row.label}</span>
                          <span className="text-white">{row.used.toLocaleString()} / {row.limit?.toLocaleString() || "∞"}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${row.limit && row.limit > 0 ? Math.min((row.used / row.limit) * 100, 100) : 0}%` }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${row.color} rounded-full`}
                            style={{ boxShadow: `0 0 12px ${row.glow}` }}
                          />
                        </div>
                      </div>
                    </ProgressTooltip>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={item}>
          <Link href="/studio" className="block h-full group">
            <div className="aether-glass-wrapper rounded-[24px] h-full transition-transform duration-500 group-hover:-translate-y-2">
              <div className="aether-glass p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
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
        </motion.div>
      </div>
    </main>
  );
}
