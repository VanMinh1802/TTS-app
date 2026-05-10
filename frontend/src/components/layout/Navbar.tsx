"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { SkeletonNavbar } from "./SkeletonNavbar";

export function Navbar() {
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
    try {
      await logout();
      router.push("/");
    } catch {}
  };

  if (status === 'loading') {
    return <SkeletonNavbar />;
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050508]/90 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="flex items-center gap-1">
            {["T", "2", "V"].map((letter, i) => (
              <motion.div
                key={letter}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#C968F7] flex items-center justify-center"
                animate={{
                  y: [0, -1, -10, -16, -10, -1, 0],
                  scaleX: [1, 1.3, 0.92, 0.85, 0.92, 1.15, 1],
                  scaleY: [1, 0.7, 1.08, 1.18, 1.08, 0.85, 1],
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.45, 0.05, 0.55, 0.95],
                  times: [0, 0.06, 0.25, 0.45, 0.65, 0.85, 1],
                  repeat: Infinity,
                  repeatDelay: 1.7,
                  delay: i * 0.2,
                }}
              >
                <span className="text-white font-bold text-[11px]">{letter}</span>
              </motion.div>
            ))}
          </div>
          <span className="text-2xl font-bold tracking-tighter text-[#F4F4F5]">
            Type<span className="aether-text-gradient">2</span>Vibe
          </span>
        </Link>

        <DesktopNav isLoggedIn={isLoggedIn} pathname={pathname} />

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#A1A1AA] hover:text-[#818CF8] hover:bg-white/5 transition-all duration-200"
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLight ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )}
          </button>

          {isLoggedIn ? (
            <div 
              className="relative"
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu tài khoản"
                className={`flex items-center gap-3 p-2 rounded-full border transition-all min-h-[44px] min-w-[44px] ${
                  isMenuOpen 
                    ? "bg-[#6366F1]/10 border-[#6366F1]/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <div className="w-9 h-9 bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center text-sm font-semibold rounded-full border border-[#6366F1]/30 relative">
                  {user?.subscription_tier && user.subscription_tier !== 'free' ? (
                    <span className={`absolute -top-1 -right-1 px-1 py-0.5 rounded-full text-[7px] font-bold uppercase border ${
                      user.subscription_tier === 'pro'
                        ? 'bg-[#6366F1] text-white border-[#818CF8]/50 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                        : 'bg-amber-500 text-black border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                    }`}>
                      {user.subscription_tier === 'pro' ? 'P' : 'E'}
                    </span>
                  ) : (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]"></span>
                  )}
                  <motion.svg 
                    animate={{ rotate: isMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={2} 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </motion.svg>
                </div>
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 z-50 pt-2"
                  >
                    <div className="aether-glass-wrapper rounded-[16px] shadow-2xl">
                      <div className="aether-glass p-3 overflow-hidden flex flex-col">
                        <div className="px-3 py-3 border-b border-white/10 mb-2">
                          <p className="text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-1">{user?.name || 'Tài khoản'}</p>
                          <p className="text-sm font-medium text-[#F4F4F5] truncate">{user?.email || 'Đang tải...'}</p>
                          {user?.subscription_tier && user.subscription_tier !== 'free' && (
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                              user.subscription_tier === 'pro'
                                ? 'bg-gradient-to-r from-[#6366F1]/15 to-[#C968F7]/15 border-[#818CF8]/40 text-[#818CF8]'
                                : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            }`}>
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              {user.subscription_tier.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <Link 
                          href="/settings" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-xs font-medium uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-[#6366F1]/20 rounded-lg transition-colors"
                        >
                          Cài đặt
                        </Link>
                        {user?.is_admin && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-xs font-medium uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-[#6366F1]/20 rounded-lg transition-colors"
                        >
                          Quản trị Hệ thống
                        </Link>
                        )}
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-3 py-3 text-xs font-medium uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors mt-1"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="aether-btn aether-btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-widest">
                  Đăng nhập
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            className="md:hidden p-2 text-[#D4D4D8] hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <MobileNav
        isMobileMenuOpen={isMobileMenuOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
        isLight={isLight}
        onToggleTheme={toggleTheme}
      />
    </nav>
  );
}
