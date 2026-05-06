'use client';

import { useT } from "@/shared/i18n";

interface VoiceSettingsProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export function VoiceSettings({ speed, onSpeedChange }: VoiceSettingsProps) {
  const t = useT();
  const speedDisplay = Number.isInteger(speed) ? speed : speed.toFixed(1);
  
  return (
    <div className="aether-glass-wrapper rounded-[24px] transition-all duration-300 group hover:opacity-90">
      <div className="aether-glass rounded-[24px] p-4">
        <label className="block text-[14px] font-medium tracking-wide text-[#A1A1AA] mb-3 flex items-center justify-between">
          <span>{t.studio.speedLabel}</span>
          <span className="text-[#F4F4F5] font-semibold text-[15px]">{speedDisplay}x</span>
        </label>
        <div className="relative py-2">
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-[#F4F4F5] h-[2px] bg-[#333333] rounded-full appearance-none cursor-pointer outline-none transition-all"
            style={{
              background: `linear-gradient(to right, #6366F1 ${((speed - 0.5) / 1.5) * 100}%, var(--range-track-bg, #333333) ${((speed - 0.5) / 1.5) * 100}%)`
            }}
            data-range-track="true"
            role="slider"
          />
        </div>
        <div className="relative flex justify-between text-[12px] font-normal tracking-wide text-[#71717A] mt-3 px-1">
          <span>0.5X</span>
          <span className="absolute left-[33%] -translate-x-1/2">1.0X</span>
          <span>2.0X</span>
        </div>
      </div>
    </div>
  );
}