# Dashboard Incremental Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task.

**Goal:** Polish dashboard with animated counters, skeleton loading, bar chart, tooltips, and quick-stats strip.

**Architecture:** Single-page rewrite of `app/dashboard/page.tsx` with inline sub-components. No backend changes, no new dependencies. Uses existing Framer Motion patterns and Aether design system.

**Tech Stack:** Next.js 16, Tailwind v4, Framer Motion, existing `aether-glass` CSS classes

---

> **Spec:** `.sdlc/SPEC019-core-dashboard-polish/spec.md`
> **Status:** Approved
> **Author:** Kilo
> **Date:** 2026-05-05

---

## 1. File Map

| File | Action |
|------|--------|
| `frontend/src/app/dashboard/page.tsx` | Rewrite |
| `frontend/src/app/dashboard/components/DailyBarChart.tsx` | New |
| `frontend/src/app/dashboard/components/SkeletonCard.tsx` | New |
| `frontend/src/app/dashboard/components/CounterText.tsx` | New |
| `frontend/src/app/dashboard/components/ProgressTooltip.tsx` | New |

---

## 2. Implementation Tasks

### Task 1: Create CounterText component

**Files:** `frontend/src/app/dashboard/components/CounterText.tsx`

Animated number that counts from 0 to target value.

```tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CounterText({ value, suffix = '', duration = 1.5, className }: Props) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const end = start + duration * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now >= end) { setDisplay(value); clearInterval(timer); return; }
      const progress = (now - start) / (duration * 1000);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration, inView]);

  return (
    <motion.span
      ref={ref}
      className={className}
      animate={display === value ? { textShadow: ['0 0 0 rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.4)', '0 0 0 rgba(99,102,241,0)'] } : {}}
      transition={{ duration: 0.8 }}
    >
      {display.toLocaleString()}{suffix}
    </motion.span>
  );
}
```

---

### Task 2: Create SkeletonCard component

**Files:** `frontend/src/app/dashboard/components/SkeletonCard.tsx`

Shimmer placeholder matching stat cards layout.

```tsx
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
```

---

### Task 3: Create DailyBarChart component

**Files:** `frontend/src/app/dashboard/components/DailyBarChart.tsx`

7-bar inline chart from usage history data.

```tsx
'use client';
import { motion } from 'framer-motion';

interface DayData {
  date: string;
  label: string;
  value: number;
}

interface Props {
  data: DayData[];
  maxValue: number;
  label: string;
}

export function DailyBarChart({ data, maxValue, label }: Props) {
  if (data.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-[#71717A]">
        <svg className="w-10 h-10 mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm uppercase tracking-widest font-semibold">Chưa ghi nhận hoạt động nào</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#A1A1AA] mb-6">{label}</p>
      <div className="flex items-end gap-4 h-40 px-2">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <motion.span
              className="text-[9px] font-bold text-[#D4D4D8]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value}
            </motion.span>
            <motion.div
              className="w-full rounded-t-lg"
              style={{ background: 'linear-gradient(to top, #6366F1, #818CF8)', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}
              initial={{ height: 0 }}
              animate={{ height: `${maxValue > 0 ? (d.value / maxValue) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
            />
            <span className="text-[9px] text-[#A1A1AA]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 4: Create ProgressTooltip component

**Files:** `frontend/src/app/dashboard/components/ProgressTooltip.tsx`

Tooltip on hover over progress bars.

```tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  label: string;
  used: number;
  limit: number | null;
  unit: string;
  children: React.ReactNode;
}

export function ProgressTooltip({ label, used, limit, unit, children }: Props) {
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
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] whitespace-nowrap"
            style={{ background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(12px)' }}
          >
            <p className="text-[10px] font-medium text-[#D4D4D8]">
              Đã dùng {used.toLocaleString()} / {limit?.toLocaleString() || '∞'} {unit} ({pct}%)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### Task 5: Rewrite dashboard page

**Files:** `frontend/src/app/dashboard/page.tsx`

Full page rewrite incorporating all new components.

See the complete implementation code below — combining:
- Skeleton loading state
- CounterText for stats
- ProgressTooltip for bars
- DailyBarChart for history
- QuickStatsStrip below welcome
- Stagger entrance animations
- Greeting theo giờ

```tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api-client";
import { getCurrentUser } from "@/features/auth/api/auth-api";
import { CounterText } from "./components/CounterText";
import { SkeletonCard } from "./components/SkeletonCard";
import { DailyBarChart } from "./components/DailyBarChart";
import { ProgressTooltip } from "./components/ProgressTooltip";

// ... (types same as current)

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Chào buổi tối";
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function DashboardPage() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotaData, userData, historyData] = await Promise.all([
          apiRequest<QuotaStatus>("/quota"),
          getCurrentUser(),
          apiRequest<{ history: UsageHistoryItem[] }>("/quota/usage"),
        ]);
        setQuota(quotaData);
        setUser(userData);
        setHistory(historyData.history);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = getGreeting();
  const todayStats = useMemo(() => {
    const today = history[0] || { characters_used: 0, api_calls: 0, storage_mb: 0 };
    return today;
  }, [history]);

  const chartData = useMemo(() => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const last7 = history.slice(0, 7).reverse();
    return last7.map((h, i) => ({
      date: h.date,
      label: days[new Date(h.date).getDay()],
      value: h.characters_used,
    }));
  }, [history]);

  const chartMax = Math.max(...chartData.map((d) => d.value), 1);

  const stats = [
    { label: "Ký tự đã dùng", value: quota?.usage.characters_this_month || 0 },
    { label: "API Calls hôm nay", value: quota?.usage.api_calls_today || 0 },
    { label: "Lưu trữ", value: quota?.usage.storage_used_mb || 0, suffix: " MB" },
  ];

  const progressRows = [
    { label: "Ký tự / Tháng", key: "characters", used: quota?.usage.characters_this_month || 0, limit: quota?.limits.characters_per_month, unit: "ký tự", color: "from-[#6366F1] to-[#818CF8]", glow: "#818CF8" },
    { label: "Dung lượng", key: "storage", used: quota?.usage.storage_used_mb || 0, limit: quota?.limits.storage_mb, unit: "MB", color: "from-[#C968F7] to-[#D8B4E2]", glow: "#C968F7" },
    { label: "API Calls / Ngày", key: "api", used: quota?.usage.api_calls_today || 0, limit: quota?.limits.api_calls_per_day, unit: "lượt", color: "from-[#22C55E] to-[#16A34A]", glow: "#22C55E" },
  ];

  const container = { animate: { transition: { staggerChildren: 0.08 } } };
  const item = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 min-h-screen pt-32">
      {/* Welcome */}
      <motion.div variants={container} initial="initial" animate="animate" className="mb-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {greeting}, <span className="bg-gradient-to-r from-[#818CF8] to-[#C968F7] bg-clip-text text-transparent">{user?.email?.split("@")[0] || "..."}</span>
            </h1>
            <span className="aether-badge mt-2">{quota?.tier === "pro" ? "Gói Chuyên Nghiệp" : "Gói Cơ Bản"}</span>
          </div>
        </motion.div>

        {!loading && (
          <motion.div variants={item} className="flex gap-6 mt-4 text-[11px] text-[#A1A1AA]">
            <span>Hôm nay: {todayStats.api_calls} lượt tạo</span>
            <span>{todayStats.characters_used.toLocaleString()} ký tự</span>
            <span>{todayStats.storage_mb} MB lưu trữ</span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => <motion.div key={i} variants={item}><SkeletonCard /></motion.div>)}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <div className="aether-glass-wrapper rounded-[24px] h-full transition-transform duration-300 hover:-translate-y-1">
                <div className="aether-glass p-8 h-full flex flex-col justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-[#818CF8] mb-2">{stat.label}</p>
                  <CounterText
                    value={stat.value}
                    suffix={stat.suffix || ""}
                    className="text-[32px] font-bold tracking-tight text-white"
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

      {/* Chart */}
      {!loading && (
        <motion.div variants={container} initial="initial" animate="animate">
          <motion.div variants={item}>
            <div className="aether-glass-wrapper rounded-[24px]">
              <div className="aether-glass p-8">
                <DailyBarChart data={chartData} maxValue={chartMax} label="Ký tự đã dùng — 7 ngày gần đây" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
```

---

## 3. Self-Review

| Spec Requirement | Task |
|-----------------|------|
| FR-1: Welcome thu gọn | Task 5 (greeting + tier badge) |
| FR-2: Counter animate + glow pulse | Task 1 + Task 5 |
| FR-3: Progress bar fill + tooltip | Task 4 + Task 5 |
| FR-4: Bar chart 7-day | Task 3 + Task 5 |
| FR-5: Skeleton loading | Task 2 + Task 5 |
| FR-6: Quick-stats strip | Task 5 |
| FR-7: Stagger entrance | Task 5 |
| FR-8: TiltCard hover | Task 5 |
| FR-9: Empty state | Task 3 |

All requirements covered. No TBDs. Types consistent.

---

## 4. Change Log

| Date | Version | Changed By | Change Summary |
|------|---------|------------|----------------|
| 2026-05-05 | v1.0 | Kilo | Initial plan |
