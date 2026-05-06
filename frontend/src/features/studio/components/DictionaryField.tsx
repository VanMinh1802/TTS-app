"use client";

import React from 'react';

export const Field = React.memo(function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[9px] font-light uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</label>
      {children}
    </div>
  );
});
