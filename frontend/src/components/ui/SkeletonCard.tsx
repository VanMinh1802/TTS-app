"use client";
import { motion } from "framer-motion";

interface SkeletonCardProps {
  variant?: "card" | "row";
  className?: string;
}

export function SkeletonCard({ variant = "card", className = "" }: SkeletonCardProps) {
  if (variant === "row") {
    return (
      <div className={`flex items-center gap-4 p-4 ${className}`}>
        <motion.div
          className="h-8 w-8 rounded-lg shrink-0"
          style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-3 w-3/4 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
            animate={{ x: [-40, 40] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-2 w-1/2 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.07), rgba(255,255,255,0.03))" }}
            animate={{ x: [-30, 30] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`aether-glass-wrapper rounded-[24px] h-full ${className}`}>
      <div className="aether-glass p-8 h-full flex flex-col justify-between overflow-hidden">
        <div className="space-y-4">
          <motion.div
            className="h-3 w-24 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
            animate={{ x: [-80, 80] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-8 w-32 rounded-lg"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
            animate={{ x: [-60, 60] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

export function SkeletonVoiceCard() {
  return (
    <div className="aether-glass-wrapper rounded-[24px] h-full">
      <div className="aether-glass p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <motion.div
              className="h-6 w-32 rounded-lg"
              style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
              animate={{ x: [-40, 40] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="h-3 w-16 rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
              animate={{ x: [-20, 20] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </div>
          <motion.div
            className="h-5 w-5 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="space-y-3 mb-8 flex-1">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="flex justify-between items-end pb-2 border-b border-white/5"
            >
              <motion.div
                className="h-2 w-16 rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))" }}
                animate={{ x: [-15, 15] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              />
              <motion.div
                className="h-2 w-12 rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))" }}
                animate={{ x: [-10, 10] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              />
            </motion.div>
          ))}
        </div>
        <motion.div
          className="h-10 w-full rounded-[8px]"
          style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))" }}
          animate={{ x: [-60, 60] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
