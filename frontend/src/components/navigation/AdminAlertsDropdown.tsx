"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@/features/auth";
import { Bell } from "lucide-react";

interface Alert {
  id: string;
  severity: "CRITICAL" | "WARNING";
  message: string;
  details: any;
  is_read: boolean;
  created_at: string;
}

export function AdminAlertsDropdown() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const data = await apiRequest<Alert[]>("/admin/alerts");
      setAlerts(data);
    } catch (e) {
      console.error("Failed to fetch alerts", e);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiRequest("/admin/alerts/mark-read", { method: "POST" });
      setAlerts(alerts.map(a => ({ ...a, is_read: true })));
    } catch (e) {
      console.error("Failed to mark alerts as read", e);
    }
  };

  if (!user?.is_admin) return null;

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full text-[#A1A1AA] hover:text-[#818CF8] hover:bg-white/5 transition-all duration-200"
      >
        <Bell className="w-4 h-4 md:w-5 md:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#050508] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 md:w-96 z-50 pt-2"
          >
            <div className="aether-glass-wrapper rounded-[16px] shadow-2xl">
              <div className="aether-glass overflow-hidden flex flex-col max-h-[500px]">
                <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">System Alerts</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-[#818CF8] hover:text-white transition-colors uppercase tracking-widest font-bold"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#A1A1AA]">No alerts found.</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {alerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-4 transition-colors ${!alert.is_read ? 'bg-white/[0.02]' : 'opacity-70'} hover:bg-white/[0.04]`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                              alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-[10px] text-[#71717A]">
                              {new Date(alert.created_at + (!alert.created_at.includes('Z') ? 'Z' : '')).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-sm text-white mb-2">{alert.message}</p>
                          {alert.details && alert.details.path && (
                            <div className="bg-black/40 rounded p-2 text-[11px] text-[#A1A1AA] font-mono break-all border border-white/5">
                              {alert.details.method} {alert.details.path}
                              {alert.details.latency_ms && ` - ${alert.details.latency_ms}ms`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
