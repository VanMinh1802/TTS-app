"use client";

import { FadeIn } from "@/components/motion";

export interface StatsData {
  totalRequests: number;
  successRate: string;
  activeKeys: number;
  characters: number;
}

export function ApiKeyStats({ stats }: { stats: StatsData }) {
  return (
    <FadeIn delay={0.1}>
      <div className="aether-glass-wrapper rounded-[24px] mb-8">
        <div className="aether-glass p-6">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#818CF8] mb-6">Thống kê Sử dụng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="text-center md:text-left pt-4 md:pt-0">
              <p className="text-4xl md:text-5xl font-bold text-[#F4F4F5] mb-1">{stats.totalRequests.toLocaleString()}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA]">Tổng truy vấn</p>
            </div>
            <div className="text-center md:text-left pt-4 md:pt-0 md:pl-6">
              <p className="text-4xl md:text-5xl font-bold text-[#6366F1] mb-1">{stats.successRate}%</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA]">Tỷ lệ Thành công</p>
            </div>
            <div className="text-center md:text-left pt-4 md:pt-0 md:pl-6">
              <p className="text-4xl md:text-5xl font-bold text-[#818CF8] mb-1">{(stats.characters / 1000).toFixed(1)}K</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA]">Ký tự đã xử lý</p>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
