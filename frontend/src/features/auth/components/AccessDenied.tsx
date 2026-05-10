import { useT } from "@/shared/i18n";

export function AccessDenied() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-light">
      <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full border-red-500/20">
        <div className="aether-glass p-8 bg-red-950/10 text-center">
          <svg className="w-10 h-10 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-red-400 mb-2">{t.auth.accessDenied}</h2>
          <p className="font-light text-sm text-[#D4D4D8] leading-relaxed">
            {t.auth.insufficientPermissions}
          </p>
        </div>
      </div>
    </div>
  );
}
