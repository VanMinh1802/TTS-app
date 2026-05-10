"use client";

import { useT } from "@/shared/i18n";
import { FadeIn } from "@/components/motion";

interface UsageHistoryItem {
  date: string;
  characters_used: number;
  api_calls: number;
  storage_mb: number;
}

interface Props {
  history: UsageHistoryItem[];
  formatDate: (iso: string | null) => string;
}

export default function UsageHistory({ history, formatDate }: Props) {
  const t = useT();
  return (
    <FadeIn delay={0.5}>
      <div className="aether-glass-wrapper rounded-[24px]">
        <div className="aether-glass p-8">
          <h2 className="text-[18px] font-semibold tracking-wide text-white mb-6">{t.dashboard.usageHistory}</h2>

          {history.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[24px] text-[#71717A] bg-white/[0.01]">
              <svg className="w-10 h-10 mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm uppercase tracking-widest font-semibold">{t.dashboard.noActivity}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.2em] text-[#818CF8] border-b border-white/10">
                    <th className="pb-4 font-bold">{t.dashboard.recordDate}</th>
                    <th className="pb-4 font-bold text-right">{t.common.characters}</th>
                    <th className="pb-4 font-bold text-right">API Calls</th>
                    <th className="pb-4 font-bold text-right">{t.dashboard.storageCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-normal">
                  {history.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-5 text-sm text-[#D4D4D8]">{formatDate(item.date)}</td>
                      <td className="py-5 text-sm text-right text-white font-mono">{item.characters_used.toLocaleString()}</td>
                      <td className="py-5 text-sm text-right text-white font-mono">{item.api_calls}</td>
                      <td className="py-5 text-sm text-right text-white font-mono">{item.storage_mb} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
