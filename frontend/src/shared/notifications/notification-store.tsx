"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

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
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((notification: Omit<Notification, "id" | "createdAt">) => {
    const id = Math.random().toString(36).substring(2, 15);
    setNotifications((prev) => {
      const next = [...prev, { ...notification, id, createdAt: new Date() }];
      if (next.length > 20) return next.slice(-20);
      return next;
    });
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
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