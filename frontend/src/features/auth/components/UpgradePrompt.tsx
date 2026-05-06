import Link from 'next/link';

export function UpgradePrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-light">
      <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full border-[#C968F7]/20">
        <div className="aether-glass p-8 text-center">
          <svg className="w-10 h-10 text-[#C968F7] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C968F7] mb-2">Yêu cầu nâng cấp</h2>
          <p className="font-light text-sm text-[#D4D4D8] leading-relaxed mb-6">
            Tính năng này yêu cầu gói Pro hoặc Enterprise. Vui lòng nâng cấp tài khoản để tiếp tục.
          </p>
          <Link href="/pricing" className="aether-btn aether-btn-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest">
            Xem bảng giá
          </Link>
        </div>
      </div>
    </div>
  );
}
