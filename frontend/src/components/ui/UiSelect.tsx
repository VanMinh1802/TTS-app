'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  label?: string;
  width?: string;
  buttonClassName?: string;
  id?: string;
}

export function UiSelect({ value, onChange, options, placeholder, className = '', label, width, buttonClassName, id }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
        });
      }
    }
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label ?? placeholder ?? '';

  return (
    <div ref={ref} className={clsx('relative', className)}>
      {label && (
        <label className="block text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">{label}</label>
      )}
      <button
        ref={btnRef}
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-2 px-5 pr-10 py-3 rounded-xl text-sm transition-all cursor-pointer w-full text-left whitespace-nowrap',
          buttonClassName || clsx(
            'border bg-white/5 border-white/10 text-[#D4D4D8] hover:bg-white/[0.07] hover:border-white/20',
            'focus:outline-none focus:border-[#818CF8]/50 focus:bg-white/10',
            'shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]',
            width || ''
          )
        )}
      >
        <span className="flex-1 min-w-0 truncate">{displayText}</span>
        <motion.svg
          className="w-4 h-4 text-[#A1A1AA]/70 pointer-events-none shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </motion.svg>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={undefined}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="z-[100] max-h-[220px] overflow-y-auto custom-scrollbar rounded-xl border border-white/[0.08] shadow-[0_15px_40px_-8px_rgba(0,0,0,0.6)] bg-[#0A0A0F]"
          style={dropdownStyle}
        >
          {options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onMouseDown={(e) => { e.preventDefault(); if (!option.disabled) { onChange(option.value); setOpen(false); } }}
              className={clsx(
                'w-full text-left px-5 py-2.5 text-sm transition-all duration-150',
                i > 0 && 'border-t border-white/[0.04]',
                option.value === value && !option.disabled
                  ? 'text-[#C4B99A] bg-[#6366F1]/10 font-medium'
                  : option.disabled
                    ? 'text-[#333333] cursor-not-allowed'
                    : 'text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-white/[0.03]'
              )}
            >
              {option.label}
            </button>
          ))}
        </motion.div>,
        document.body
      )}
    </div>
  );
}
