"use client";

import { useT } from "@/shared/i18n";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="min-h-[calc(100dvh-5rem)] flex items-center justify-center px-4">
      <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full">
        <div className="aether-glass p-8 text-center">
          <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">{t.error.heading}</h2>
          <p className="text-sm text-[#A1A1AA] mb-6">{error.message || t.error.cannotLoadPage}</p>
          <button onClick={reset} className="aether-btn aether-btn-primary px-6 py-2.5 text-[10px] font-medium uppercase tracking-widest">
            {t.error.retry}
          </button>
        </div>
      </div>
    </div>
  );
}
