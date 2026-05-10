'use client';

import { useEffect } from 'react';
import { useT } from "@/shared/i18n";

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onOverLimit?: (isOver: boolean) => void;
}

export function TextInput({ value, onChange, onOverLimit }: TextInputProps) {
  const t = useT();
  const charCount = value.length;
  const maxChars = 5000;
  const isOver = charCount > maxChars;

  useEffect(() => {
    onOverLimit?.(isOver);
  }, [isOver, onOverLimit]);

  return (
    <div className="flex flex-col h-full group/input">
      <div className="flex flex-col h-full relative transition-all duration-300">
        <div className="aether-glass-wrapper rounded-[24px] h-full flex flex-col">
          <div className="aether-glass rounded-[24px] flex flex-col h-full">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
              maxLength={maxChars}
              className="w-full flex-1 min-h-[360px] px-4 pt-8 pb-4 bg-transparent rounded-t-[24px] font-medium text-[16px] tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 text-white placeholder:text-[#A1A1AA] transition-all leading-relaxed drop-shadow-sm"
              placeholder={t.studio.textInputPlaceholder}
              role="textbox"
            />
            <div className="flex justify-between items-center px-4 py-2 border-t border-white/10 rounded-b-[24px] bg-black/40">
              <span className={`text-[12px] font-medium tracking-wide ${charCount > maxChars ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' : 'text-[#71717A]'}`}>
                {charCount} <span className="opacity-50">/ {maxChars}</span> {t.studio.characters}
              </span>
              <button 
                type="button"
                onClick={() => onChange('')}
                className="text-[12px] font-medium text-[#71717A] hover:text-[#F4F4F5] transition-colors"
              >
                {t.studio.clearText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
