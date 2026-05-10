"use client";

import { useT } from "@/shared/i18n";

export default function Loading() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-[#A1A1AA]">{t.common.loading}</p>
      </div>
    </div>
  );
}
