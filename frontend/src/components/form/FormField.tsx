"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-red-400 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export function getFieldErrorClass(error?: string): string {
  return error
    ? "border-red-500/50 focus:border-red-500"
    : "focus:border-[#818CF8]/50";
}
