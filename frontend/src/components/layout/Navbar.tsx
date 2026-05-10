"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth";
import { DesktopNav, authNavItems } from "./DesktopNav";
import { SkeletonNavbar } from "./SkeletonNavbar";
import { useT } from "@/shared/i18n";

export function Navbar() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const isLoggedIn = status === 'authenticated';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(localStorage.getItem("theme") === "light");
    const handleStorage = () => setIsLight(localStorage.getItem("theme") === "light");
    window.addEventListener("storage", handleStorage);
    window.addEventListener("theme-changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("theme-changed", handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
    window.dispatchEvent(new Event("theme-changed"));
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    try { await logout(); router.push("/"); } catch {}
  };

  if (status === 'loading') return <SkeletonNavbar />;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050508]/90 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 md:gap-3 hover:opacity-80 transition-opacity shrink-0">
          <div className="flex items-center gap-1">
            {["T", "2", "V"].map((letter, i) => (
              <motion.div
                key={letter}
                className="w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg bg-gradient-to-br from-[#6366F1] to-[#C968F7] flex items-center justify-center"
                animate={{ y: [0, -1, -8, -12, -8, -1, 0], scaleX: [1, 1.2, 0.93, 0.87, 0.93, 1.1, 1], scaleY: [1, 0.75, 1.06, 1.14, 1.06, 0.88, 1] }}
                transition={{ duration: 0.6, ease: [0.45, 0.05, 0.55, 0.95], times: [0, 0.06, 0.25, 0.45, 0.65, 0.85, 1], repeat: Infinity, repeatDelay: 1.7, delay: i * 0.2 }}
              >
                <span className="text-white font-bold text-[9px] md:text-[11px]">{letter}</span>
              </motion.div>
            ))}
          </div>
          <span className="text-base md:text-2xl font-bold tracking-tighter text-[#F4F4F5]">
            Type<span className="aether-text-gradient">2</span>Vibe
          </span>
        </Link>

        <DesktopNav isLoggedIn={isLoggedIn} pathname={pathname} />

        <div className="flex items-center gap-2 md:gap-6">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full text-[#A1A1AA] hover:text-[#818CF8] hover:bg-white/5 transition-all duration-200"
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLight ? (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
            ) : (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
            )}
          </button>

          {isLoggedIn ? (
            <>
              <div className="relative hidden md:block" onMouseEnter={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={t.nav.accountMenu}
                  className={`flex items-center gap-3 p-2 rounded-full border transition-all min-h-[44px] min-w-[44px] ${
                    isMenuOpen ? "bg-[#6366F1]/10 border-[#6366F1]/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                  }`}>
                  <div className="w-9 h-9 bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center text-sm font-semibold rounded-full border border-[#6366F1]/30 relative">
                    {user?.subscription_tier && user.subscription_tier !== 'free' ? (
                      <span className={`absolute -top-1 -right-1 px-1 py-0.5 rounded-full text-[7px] font-bold uppercase border ${
                        user.subscription_tier === 'pro' ? 'bg-[#6366F1] text-white border-[#818CF8]/50 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-amber-500 text-black border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                      }`}>{user.subscription_tier === 'pro' ? 'P' : 'E'}</span>
                    ) : (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]" />
                    )}
                    <motion.svg animate={{ rotate: isMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </motion.svg>
                  </div>
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-3 w-64 z-50 pt-2">
                      <div className="aether-glass-wrapper rounded-[16px] shadow-2xl">
                        <div className="aether-glass p-3 overflow-hidden flex flex-col">
                          <div className="px-3 py-3 border-b border-white/10 mb-2">
                            <p className="text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-1">{user?.name || t.nav.account}</p>
                            <p className="text-sm font-medium text-[#F4F4F5] break-all">{user?.email || t.common.loading}</p>
                            {user?.subscription_tier && user.subscription_tier !== 'free' && (
                              <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                user.subscription_tier === 'pro' ? 'bg-gradient-to-r from-[#6366F1]/15 to-[#C968F7]/15 border-[#818CF8]/40 text-[#818CF8]' : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                              }`}>
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                {user.subscription_tier.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-xs font-medium uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-[#6366F1]/20 rounded-lg transition-colors">{t.nav.settings}</Link>
                          {user?.is_admin && (
                            <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-xs font-medium uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-[#6366F1]/20 rounded-lg transition-colors">{t.nav.admin}</Link>
                          )}
                          <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-3 py-3 text-xs font-medium uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors mt-1">{t.nav.logout}</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
                className="md:hidden p-2 text-[#D4D4D8] hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login"><button className="aether-btn aether-btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-widest">{t.nav.login}</button></Link>
              </div>
              <div className="md:hidden flex items-center gap-2">
                <Link href="/login"><button className="bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">{t.nav.login}</button></Link>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
                  className="p-2 text-[#D4D4D8] hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 max-h-[calc(100dvh-64px)] overflow-y-auto"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {isLoggedIn ? (
                <>
                  {user && (
                    <div className="px-3 py-3 mb-2 border-b border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-0.5">{user.name || t.nav.account}</p>
                      <p className="text-xs text-[#D4D4D8] break-all">{user.email}</p>
                      {user.subscription_tier && user.subscription_tier !== 'free' && (
                        <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          user.subscription_tier === 'pro' ? 'bg-gradient-to-r from-[#6366F1]/15 to-[#C968F7]/15 border-[#818CF8]/40 text-[#818CF8]' : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                        }`}>
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          {user.subscription_tier.toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  {authNavItems.map((item) => (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors min-h-[44px] ${
                        isActive(item.href) ? 'text-white bg-[#6366F1]/10 border border-[#6366F1]/30' : 'text-[#D4D4D8] hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-1">
                    <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors min-h-[44px] ${
                        isActive('/settings') ? 'text-white bg-[#6366F1]/10 border border-[#6366F1]/30' : 'text-[#D4D4D8] hover:text-white hover:bg-white/10'
                      }`}>{t.nav.settings}</Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors min-h-[44px]">{t.nav.logout}</button>
                  </div>
                </>
              ) : (
                <>
                  {[{ label: "Pricing", href: "/pricing" }, { label: "Voices", href: "/voices" }].map((item) => (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors min-h-[44px] ${
                        isActive(item.href) ? 'text-white bg-[#6366F1]/10 border border-[#6366F1]/30' : 'text-[#D4D4D8] hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
