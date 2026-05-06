'use client';
import { SyncProgress } from '../types';

interface Props {
  progress: SyncProgress;
}

export function LibrarySyncBar({ progress }: Props) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] flex items-center gap-4 px-6 py-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#818CF8] border-t-transparent animate-spin shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-xs font-light text-[#A1A1AA] mb-2">
            <span>{progress.inProgress ? 'Đang đồng bộ lên Cloud...' : 'Đồng bộ hoàn tất'}</span>
            <span className="text-[#D4D4D8] font-mono">{progress.completed}/{progress.total}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <div
              className="h-full bg-gradient-to-r from-[#6366F1] to-[#C968F7] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {progress.failed > 0 && (
          <span className="text-xs font-medium text-red-400">{progress.failed} thất bại</span>
        )}
      </div>
    </div>
  );
}
