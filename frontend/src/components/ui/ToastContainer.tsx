'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '@/shared/notifications/notification-store';

const severityConfig = {
  success: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-[#22C55E] to-[#16A34A]',
    border: 'border-[#22C55E]/20',
  },
  error: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    gradient: 'from-[#EF4444] to-[#DC2626]',
    border: 'border-[#EF4444]/20',
  },
  warning: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    gradient: 'from-[#F59E0B] to-[#D97706]',
    border: 'border-[#F59E0B]/20',
  },
  info: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
    gradient: 'from-[#6366F1] to-[#4F46E5]',
    border: 'border-[#6366F1]/20',
  },
};

function ToastItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const config = severityConfig[notification.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`toast-card pointer-events-auto w-full max-w-sm rounded-xl border ${config.border} overflow-hidden shadow-[0_10px_40px_-8px_rgba(0,0,0,0.3)]`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient}`} />

        {/* Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${config.gradient} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F4F4F5]">
            {notification.title}
          </p>
          <p className="text-xs font-light text-[#A1A1AA] mt-0.5 leading-relaxed">
            {notification.message}
          </p>
          {notification.actionLabel && notification.actionHref && (
            <a
              href={notification.actionHref}
              className="inline-block mt-2 text-[10px] font-medium uppercase tracking-widest text-[#818CF8] hover:text-[#6366F1] transition-colors"
            >
              {notification.actionLabel}
            </a>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[#52525B] hover:text-[#D4D4D8] hover:bg-white/5 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export function ToastContainer() {
  const { notifications, dismiss } = useNotifications();

  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.slice(-5).reverse().map((n) => (
          <ToastItem key={n.id} notification={n} onDismiss={() => dismiss(n.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
