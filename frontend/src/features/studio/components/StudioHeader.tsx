'use client';

import React from 'react';
import { useT } from "@/shared/i18n";

interface StudioHeaderProps {
  onOpenLibrary?: () => void;
  libraryCount?: number;
}

export const StudioHeader = React.memo(function StudioHeader({ onOpenLibrary, libraryCount }: StudioHeaderProps) {
  const t = useT();
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#818CF8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#F4F4F5]">
              {t.studio.heroTitle}
            </h1>
            <p className="text-[11px] text-[#71717A] font-medium">{t.studio.heroDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">


          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/25 text-[#818CF8] text-xs font-medium hover:text-white hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 hover:border-[#6366F1]/40 transition-all hover:shadow-[0_0_16px_rgba(99,102,241,0.15)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
            </svg>
            {t.studio.libraryButton}
            {libraryCount !== undefined && libraryCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#6366F1]/20 text-[10px] font-bold text-[#818CF8]">
                {libraryCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
