"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const publicNavItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "Voices", href: "/voices" },
];

export const authNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Studio", href: "/studio" },
  { label: "Library", href: "/library" },
  { label: "Voices", href: "/voices" },
  { label: "Dictionary", href: "/dictionary" },
  { label: "API Keys", href: "/api-keys" },
  { label: "Pricing", href: "/pricing" },
];

export function DesktopNav({ isLoggedIn, pathname }: { isLoggedIn: boolean; pathname: string }) {
  const items = isLoggedIn ? authNavItems : publicNavItems;
  return (
    <div className="hidden md:flex items-center gap-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
              className={`relative px-3.5 py-3 rounded-lg text-[11px] uppercase tracking-[0.12em] font-bold transition-all duration-200 min-h-[44px] flex items-center ${
              isActive
                ? "text-white"
                : "text-[#A1A1AA]/70 hover:text-[#D4D4D8]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
