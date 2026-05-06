'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CounterText({ value, suffix = '', duration = 1.5, className }: Props) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const end = start + duration * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now >= end) { setDisplay(value); clearInterval(timer); return; }
      const progress = (now - start) / (duration * 1000);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration, inView]);

  return (
    <motion.span
      ref={ref}
      className={className}
      animate={display === value ? { textShadow: ['0 0 0 rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.4)', '0 0 0 rgba(99,102,241,0)'] } : {}}
      transition={{ duration: 0.8 }}
    >
      {display.toLocaleString()}{suffix}
    </motion.span>
  );
}
