"use client";

import { useState, useCallback, useEffect, useRef, createContext, useContext, type ReactNode } from "react";

export interface Notification {
  id: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  source?: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  notify: (notification: Omit<Notification, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
  pauseAutoDismiss: () => void;
  resumeAutoDismiss: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paused, setPaused] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    clearTimer(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [clearTimer]);

  const notify = useCallback((notification: Omit<Notification, "id" | "createdAt">) => {
    const id = Math.random().toString(36).substring(2, 15);
    setNotifications((prev) => {
      const next = [...prev, { ...notification, id, createdAt: new Date() }];
      if (next.length > 20) return next.slice(-20);
      return next;
    });

    const duration = notification.severity === "error" ? 4000 : 3000;
    const timer = setTimeout(() => {
      timersRef.current.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
    timersRef.current.set(id, timer);
  }, []);

  const pauseAutoDismiss = useCallback(() => setPaused(true), []);
  const resumeAutoDismiss = useCallback(() => setPaused(false), []);

  useEffect(() => {
    if (paused) {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    } else {
      notifications.forEach((n) => {
        const existing = timersRef.current.get(n.id);
        if (!existing) {
          const duration = n.severity === "error" ? 4000 : 3000;
          const elapsed = Date.now() - n.createdAt.getTime();
          const remaining = Math.max(0, duration - elapsed);
          const timer = setTimeout(() => {
            timersRef.current.delete(n.id);
            setNotifications((prev) => prev.filter((x) => x.id !== n.id));
          }, remaining);
          timersRef.current.set(n.id, timer);
        }
      });
    }
  }, [paused, notifications]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Omit<Notification, "id" | "createdAt">;
      if (detail) notify(detail);
    };
    window.addEventListener("notification", handler);
    return () => window.removeEventListener("notification", handler);
  }, [notify]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, pauseAutoDismiss, resumeAutoDismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

export const notificationService = {
  notify: (notification: Omit<Notification, "id" | "createdAt">) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("notification", { detail: notification });
      window.dispatchEvent(event);
    }
  },
  dismiss: () => {},
};
