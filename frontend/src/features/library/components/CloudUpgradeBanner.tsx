'use client';
import Link from 'next/link';

export function CloudUpgradeBanner() {
  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] flex items-center gap-4 px-6 py-4">
        <div className="w-10 h-10 rounded-full bg-[#6366F1]/10 border border-[#818CF8]/30 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#818CF8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#D4D4D8]">Sao lưu Cloud cho file âm thanh</p>
          <p className="text-xs font-light text-[#A1A1AA]">Nâng cấp PRO để đồng bộ thư viện qua mọi thiết bị.</p>
        </div>
        <Link href="/pricing">
          <button className="aether-btn aether-btn-primary text-xs px-5 py-2.5">
            Nâng cấp
          </button>
        </Link>
      </div>
    </div>
  );
}
