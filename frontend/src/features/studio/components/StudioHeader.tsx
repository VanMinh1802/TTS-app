'use client';

import React from 'react';
import Link from 'next/link';

interface StudioHeaderProps {
  onOpenLibrary?: () => void;
}

export const StudioHeader = React.memo(function StudioHeader({ onOpenLibrary }: StudioHeaderProps) {
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[#F4F4F5]">
          TTS Studio
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-[12px] font-medium text-[#A1A1AA] hover:text-white transition-colors"
          >
            ← Projects
          </Link>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/30 text-[#818CF8] text-xs font-medium hover:text-white hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 hover:border-[#6366F1]/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
            </svg>
            Thư viện
          </button>
        </div>
      </div>
    </div>
  );
});
