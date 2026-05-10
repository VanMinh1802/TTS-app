"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { UiSelect } from "@/components/ui/UiSelect";
import { useT } from "@/shared/i18n";

interface Props {
  genCount: number;
  setGenCount: (n: number) => void;
  genTier: string;
  setGenTier: (t: string) => void;
  genDays: number;
  setGenDays: (d: number) => void;
  generating: boolean;
  onGenerate: () => Promise<void>;
  newKeys: string[];
  onCopyAll: () => void;
}

export default function LicenseGenerator({
  genCount,
  setGenCount,
  genTier,
  setGenTier,
  genDays,
  setGenDays,
  generating,
  onGenerate,
  newKeys,
  onCopyAll,
}: Props) {
  const t = useT();
  return (
    <FadeIn delay={0.1} className="lg:col-span-1">
      <div className="aether-glass-wrapper rounded-[24px] sticky top-24">
        <div className="aether-glass p-6">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#818CF8] mb-6 flex items-center gap-3">
            <span className="w-4 h-[1px] bg-[#818CF8]/50"></span>
            {t.admin.generateNew}
          </h2>

          <div className="space-y-5 mb-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{t.admin.quantity}</label>
              <input
                type="number"
                value={genCount}
                onChange={e => setGenCount(+e.target.value)}
                min={1} max={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#818CF8]/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{t.admin.packageTier}</label>
              <UiSelect
                value={`${genTier}-${genDays}`}
                onChange={(v) => {
                  const [t, d] = v.split('-');
                  setGenTier(t); setGenDays(+d);
                }}
                options={[
                  { value: 'pro-30', label: t.admin.pro30 },
                  { value: 'pro-365', label: t.admin.pro365 },
                ]}
              />
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={generating}
            className={`aether-btn w-full py-3 min-h-[44px] text-[10px] font-medium uppercase tracking-widest ${
              generating
                ? "!bg-white/5 !border-white/10 !text-[#A1A1AA] !cursor-wait !shadow-none"
                : "aether-btn-primary"
            }`}
          >
            {generating ? t.admin.generating : t.admin.generateNLicenses.replace("{n}", String(genCount))}
          </button>

          <AnimatePresence>
            {newKeys.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="p-4 bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-[8px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-[#6366F1]">{t.admin.complete}</span>
                    <button onClick={onCopyAll} className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[4px] text-[9px] uppercase tracking-widest text-gray-300 transition-colors min-h-[44px] inline-flex items-center">
                      {t.admin.copyAll}
                    </button>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-gray-300 max-h-40 overflow-y-auto custom-scrollbar">
                    {newKeys.map((k, i) => <div key={i} className="py-1 border-b border-white/5 last:border-0">{k}</div>)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FadeIn>
  );
}
