"use client";

import React from 'react';
import { useT } from "@/shared/i18n";
import { FadeIn } from "@/components/motion";
import { UiChip } from "@/components/ui/ui-kit";

export const StudioHero = React.memo(function StudioHero() {
  const t = useT();
  const quickTips = [t.studio.tip1, t.studio.tip2, t.studio.tip3];
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <FadeIn className="max-w-2xl space-y-3">
            <UiChip className="bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 shadow-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6366F1]" />
              </span>
              {t.studio.heroChip}
            </UiChip>
            <div className="space-y-4">
              <h1 className="text-[60px] leading-[60px] tracking-[-0.025em] text-[#F4F4F5] font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">{t.studio.heroTitle}</h1>
              <p className="max-w-2xl text-[14px] font-normal leading-[22.75px] text-[#71717A]">{t.studio.heroDescription}</p>
            </div>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-3 lg:max-w-[38rem]">
            {quickTips.map((tip, index) => (
              <FadeIn key={tip} delay={0.2 + index * 0.1}>
                <div className="group flex items-start gap-4 rounded-[24px] p-5 bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:border-[#818CF8]/30 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] text-[14px] font-normal leading-[20px] text-[#A1A1AA]">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-[#D4D4D8] group-hover:text-[#818CF8] group-hover:border-[#818CF8]/50 transition-colors shadow-inner">0{index + 1}</span>
                  <span className="opacity-90 group-hover:opacity-100 group-hover:text-white transition-colors">{tip}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
