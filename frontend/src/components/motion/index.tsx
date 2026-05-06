"use client";

import { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

// Spring configurations
export const spring = {
  snappy: { stiffness: 300, damping: 30 },
  smooth: { stiffness: 150, damping: 20 },
  bouncy: { stiffness: 100, damping: 10 },
  heavy: { stiffness: 60, damping: 20 },
};

// Fade In
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ...spring.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Children
interface StaggerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerChildren({ children, className, delay = 0.05 }: StaggerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
      }}
      transition={spring.smooth}
      className={className}
    >
      {children}
    </motion.div>
  );
}





// Button Press Effect
interface PressButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
}

export function PressButton({ children, className, ...props }: PressButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px #000" }}
      transition={spring.snappy}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}



// Card Hover Tilt
interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}





