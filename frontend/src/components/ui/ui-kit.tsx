import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes } from "react";
import { clsx } from "clsx";

export function UiButton({ className, children, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode, variant?: "primary" | "secondary" | "link" }) {
  const variantClass = {
    primary: "aether-btn-primary",
    secondary: "aether-btn-secondary",
    link: "text-[#818CF8] hover:text-[#C968F7] underline-offset-4 hover:underline"
  }[variant];

  return (
    <button className={clsx("aether-btn active:scale-[0.98]", variantClass, className)} {...props}>
      {children}
    </button>
  );
}

export function UiCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={clsx("aether-glass", className)} {...props}>
      {children}
    </div>
  );
}

export function UiChip({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={clsx("inline-flex items-center gap-2 px-3 py-1 bg-[#6366F1]/10 border border-[#818CF8]/30 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#818CF8] shadow-[0_0_10px_rgba(99,102,241,0.2)]", className)} {...props}>
      {children}
    </div>
  );
}

export function UiSection({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section className={clsx("aether-glass-wrapper rounded-[24px]", className)} {...props}>
      <div className="aether-glass h-full w-full">
        {children}
      </div>
    </section>
  );
}

export function UiInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={clsx("w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#818CF8]/50 focus:bg-white/10 text-white placeholder:text-[#A1A1AA]/50 transition-all font-normal text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]", className)} {...props} />
  );
}