"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion";
import { useAuth } from "@/features/auth";
import { useT } from "@/shared/i18n";

export default function SettingsPage() {
  const t = useT();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || user.email.split("@")[0]);
    }
  }, [user]);

  return (
    <div className="min-h-[calc(100dvh-4rem)] relative text-[#F4F4F5] overflow-hidden font-light pt-4 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <main className="max-w-3xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="mb-10">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              {t.settings.systemConfig}
            </h2>
            <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">{t.settings.accountSettings}</h1>
          </div>
        </FadeIn>

        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <div className="aether-glass-wrapper rounded-[24px]">
              <div className="aether-glass rounded-[24px] p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6366F1] to-[#C968F7] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{t.settings.personalProfile}</h2>
                    <p className="text-xs text-[#A1A1AA]">{email}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="settings-name" className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{t.settings.fullName}</label>
                    <div className="relative">
                      <input
                        id="settings-name"
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-light text-sm text-[#D4D4D8] outline-none cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        value={name}
                        disabled
                      />
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="settings-email" className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{t.settings.emailLabel}</label>
                    <div className="relative">
                      <input
                        id="settings-email"
                        type="email"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 font-light text-sm text-[#71717A] outline-none cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        value={email}
                        disabled
                      />
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

        </div>
      </main>
    </div>
  );
}
