'use client';
import { LibraryTab } from '../types';

interface Props {
  activeTab: LibraryTab;
  counts: { all: number; local: number; cloud: number; synced: number };
  isPro: boolean;
  onTabChange: (tab: LibraryTab) => void;
}

const tabs: { key: LibraryTab; label: string; proOnly?: boolean }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'local', label: 'Local' },
  { key: 'cloud', label: 'Cloud', proOnly: true },
  { key: 'synced', label: 'Đã đồng bộ', proOnly: true },
];

export function LibraryTabs({ activeTab, counts, isPro, onTabChange }: Props) {
  return (
    <div className="flex gap-2 border-b border-white/[0.06] pb-4">
      {tabs.map((tab) => {
        const disabled = tab.proOnly && !isPro;
        return (
          <button
            key={tab.key}
            onClick={() => !disabled && onTabChange(tab.key)}
            disabled={disabled}
            className={`relative flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 min-h-[44px] ${
              activeTab === tab.key && !disabled
                ? 'bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : disabled
                  ? 'text-[#52525B] cursor-not-allowed opacity-40'
                  : 'text-[#818CF8] bg-[#6366F1]/10 border border-[#818CF8]/30 shadow-[0_0_8px_rgba(99,102,241,0.1)] hover:bg-[#6366F1]/15'
            }`}
          >
            {tab.label}
            {tab.key === 'synced' && counts.synced > 0 && !disabled && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                {counts.synced}
              </span>
            )}
            {disabled && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#C968F7] ml-1 px-2 py-0.5 rounded-full bg-[#C968F7]/10 border border-[#C968F7]/30 shadow-[0_0_6px_rgba(201,104,247,0.15)]">
                PRO
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
