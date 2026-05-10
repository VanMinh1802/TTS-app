"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { publicNavItems, authNavItems } from "./DesktopNav";
import { useT } from "@/shared/i18n";

interface MobileNavProps {
  isMobileMenuOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  isLight: boolean;
  onToggleTheme: () => void;
  pathname: string;
}

export function MobileNav({ isMobileMenuOpen, isLoggedIn, onClose, onLogout, isLight, onToggleTheme, pathname }: MobileNavProps) {
  const t = useT();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const handleLogout = async () => {
    onClose();
    try { await onLogout(); } catch {}
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 max-h-[calc(100dvh-64px)] overflow-y-auto"
        >
          <div className="px-6 py-6 flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                {authNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors min-h-[44px] ${
                      isActive(item.href)
                        ? 'text-white bg-[#6366F1]/10 border border-[#6366F1]/30'
                        : 'text-[#D4D4D8] hover:text-white hover:bg-white/10'
                    }`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-white/[0.06] pt-3 mt-1 space-y-1">
                  <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors min-h-[44px] ${
                      isActive('/settings')
                        ? 'text-white bg-[#6366F1]/10 border border-[#6366F1]/30'
                        : 'text-[#D4D4D8] hover:text-white hover:bg-white/10'
                    }`}
                    onClick={onClose}
                  >
                    {t.nav.settings}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors min-h-[44px]"
                  >
                    {t.nav.logout}
                  </button>
                </div>
              </>
            ) : (
              <>
                {publicNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors min-h-[44px] ${
                      isActive(item.href)
                        ? 'text-white bg-[#6366F1]/10 border border-[#6366F1]/30'
                        : 'text-[#D4D4D8] hover:text-white hover:bg-white/10'
                    }`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/login" className="block px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-[#818CF8] hover:bg-white/10 rounded-lg transition-colors min-h-[44px] flex items-center">
                  {t.nav.login}
                </Link>
              </>
            )}

            <button
              onClick={() => {
                onToggleTheme();
                onClose();
              }}
              className="flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-[#D4D4D8] hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full min-h-[44px]"
            >
              {isLight ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              )}
              <span>{isLight ? t.nav.dark : t.nav.light}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
