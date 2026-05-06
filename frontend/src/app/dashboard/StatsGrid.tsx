"use client";

import { StaggerChildren, StaggerItem, TiltCard } from "@/components/motion";

interface StatItem {
  label: string;
  value: string;
}

interface Props {
  stats: StatItem[];
  loading: boolean;
}

export default function StatsGrid({ stats, loading }: Props) {
  return (
    <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {stats.map((stat) => (
        <StaggerItem key={stat.label}>
          <TiltCard>
            <div className="aether-glass-wrapper h-full rounded-[24px]">
              <div className="aether-glass p-8 h-full flex flex-col justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-[#818CF8] mb-2">
                  {stat.label}
                </p>
                <p className="text-[32px] font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {loading ? "..." : stat.value}
                </p>
              </div>
            </div>
          </TiltCard>
        </StaggerItem>
      ))}
    </StaggerChildren>
  );
}
