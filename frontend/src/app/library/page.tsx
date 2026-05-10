'use client';

import { useT } from "@/shared/i18n";
import { FadeIn } from '@/components/motion';
import { LibraryPage } from '@/features/library';

export default function LibraryRoute() {
  const t = useT();
  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-4 pb-12">
      <div className="absolute inset-0 pointer-events-none aether-bg-gradient" />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="mb-8">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              {t.library.dataStorage}
            </h2>
            <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
              {t.library.heading}
            </h1>
          </div>
        </FadeIn>
        <LibraryPage />
      </main>
    </div>
  );
}
