'use client';
import Link from 'next/link';
import { useT } from "@/shared/i18n";

export function LibraryEmpty() {
  const t = useT();
  return (
    <div className="aether-glass-wrapper rounded-[24px] mt-6">
      <div className="aether-glass rounded-[24px] h-64 flex flex-col items-center justify-center text-center px-4">
        <div className="w-14 h-14 rounded-full bg-[#6366F1]/10 border border-[#818CF8]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <svg className="w-6 h-6 text-[#818CF8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4D4D8] mb-2">{t.library.emptyHeading}</h2>
        <p className="text-xs font-light text-[#A1A1AA] mb-6 max-w-sm">
          {t.library.emptyDesc}
        </p>
        <Link href="/studio">
          <button className="aether-btn aether-btn-primary text-xs px-6 py-2.5">
            {t.library.openStudio}
          </button>
        </Link>
      </div>
    </div>
  );
}
