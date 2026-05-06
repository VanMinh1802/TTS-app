/**
 * Shared UI components used across the application.
 */
"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { motion } from "framer-motion";

/** Loading spinner */
export function Spinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-block border-3 border-black border-t-transparent rounded-full animate-spin ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Đang tải"
    />
  );
}

/** Full-page loading state */
export function PageLoading({ message = "Đang tải..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Spinner size={40} />
      <p className="font-bold mt-4 text-[#A1A1AA]">{message}</p>
    </div>
  );
}

/** Empty state placeholder */
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="brutal-card p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {description && <p className="text-[#A1A1AA] font-medium mb-6">{description}</p>}
      {action}
    </div>
  );
}

/** Badge / Tag component */
export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const colors: Record<string, string> = {
    default: "bg-gray-200 text-black",
    success: "bg-[#00e676] text-black",
    warning: "bg-[#ffd800] text-black",
    danger: "bg-[#ff4d4d] text-white",
    info: "bg-[#e0f7fa] text-black",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 font-bold text-xs border-2 border-black uppercase ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Confirmation dialog */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
  variant = "danger",
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "default";
}) {
  if (!open) return null;

  const btnColor = variant === "danger" ? "bg-[#ff4d4d] text-white" : variant === "warning" ? "bg-[#ffd800]" : "bg-[#00e676]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="brutal-card p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-extrabold uppercase mb-2">{title}</h3>
        <p className="font-medium text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="brutal-btn px-6 py-2 font-bold">{cancelLabel}</button>
          <button onClick={onConfirm} className={`brutal-btn ${btnColor} px-6 py-2 font-bold`}>{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
