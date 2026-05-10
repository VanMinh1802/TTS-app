"use client";

import { useT } from "@/shared/i18n";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="aether-glass-wrapper rounded-[24px]">
        <div className="aether-glass p-12 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-extrabold uppercase mb-4 font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">{t.error.heading}</h1>
          <p className="text-[#A1A1AA] font-medium mb-8">{error.message || t.error.tryAgain}</p>
          <button onClick={reset} className="px-8 py-3 rounded-xl border border-[#6366F1]/30 bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 text-sm font-medium text-[#F4F4F5] hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 hover:border-[#6366F1]/50 transition-all duration-200">
            {t.error.retry}
          </button>
        </div>
      </div>
    </main>
  );
}
