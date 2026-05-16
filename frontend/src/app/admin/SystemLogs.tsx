"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api-client";
import { UiSelect } from "@/components/ui/UiSelect";

export default function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pathFilter, setPathFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: "50" });
      if (statusFilter) params.set("status_code", statusFilter);
      if (pathFilter.length >= 2) params.set("path_filter", pathFilter);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      
      const data = await apiRequest<any>(`/admin/logs?${params}`, { cache: "no-store" });
      setLogs(data.items);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, statusFilter, pathFilter, startDate, endDate]);

  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">System Request Logs</h2>
            <p className="text-xs text-[#A1A1AA]">Tổng số: {total} bản ghi</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#A1A1AA] focus:outline-none focus:border-[#6366F1]/50 w-full md:w-auto"
                title="Từ ngày"
              />
              <span className="text-white/30">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#A1A1AA] focus:outline-none focus:border-[#6366F1]/50 w-full md:w-auto"
                title="Đến ngày"
              />
            </div>
            <input 
              type="text" 
              placeholder="Lọc theo path (ví dụ: /api/tts)..." 
              value={pathFilter}
              onChange={(e) => { setPathFilter(e.target.value); setPage(1); }}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1]/50 w-full md:w-64"
            />
            <UiSelect 
              value={statusFilter} 
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: "", label: "Tất cả Status" },
                { value: "200", label: "200 (OK)" },
                { value: "400", label: "4xx (Client Error)" },
                { value: "500", label: "5xx (Server Error)" }
              ]}
              buttonClassName="border bg-black/20 border-white/10 text-[#A1A1AA] hover:bg-black/30 hover:border-[#6366F1]/30 focus:outline-none focus:border-[#6366F1]/50 w-full md:w-48 py-2.5 px-4"
              className="w-full md:w-auto"
            />
            <button onClick={() => loadLogs()} disabled={loading} className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8] hover:text-white transition-colors shrink-0">
              {loading ? "..." : "LÀM MỚI"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Thời gian</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Request (Method + Path)</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Status</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">User / IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-xs text-[#71717A]">Không có dữ liệu log</td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {logs.map((log: any, index: number) => (
                    <motion.tr 
                      key={log.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-2 px-3 text-[11px] text-[#A1A1AA] font-mono">
                        {new Date(log.timestamp + (!log.timestamp.includes('Z') ? 'Z' : '')).toLocaleString("vi-VN")}
                      </td>
                    <td className="py-2 px-3 text-[11px] text-[#A1A1AA] font-mono truncate max-w-[300px]">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 mr-2 font-bold text-[#D4D4D8] uppercase tracking-wider">{log.method}</span>
                      {log.path}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.status_code < 400 ? "text-[#22C55E] bg-[#22C55E]/10" : 
                        log.status_code < 500 ? "text-[#EAB308] bg-[#EAB308]/10" : 
                        "text-red-400 bg-red-500/10"
                      }`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-[#71717A] font-mono">
                      {log.user_email ? log.user_email : (log.user_id ? log.user_id.slice(0, 8) + "..." : log.ip_address || "Unknown")}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple pagination */}
        <div className="flex justify-between items-center mt-6">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-[11px] uppercase tracking-widest bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            TRƯỚC
          </button>
          <span className="text-[11px] text-[#A1A1AA]">Trang {page}</span>
          <button 
            disabled={logs.length < 50} 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-[11px] uppercase tracking-widest bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            SAU
          </button>
        </div>
      </div>

      {/* Drawer Component rendered via Portal to escape all stacking contexts */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-[99999] flex justify-end">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
                onClick={() => setSelectedLog(null)}
              />
              
              {/* Drawer Panel */}
              <motion.aside 
                initial={{ x: "100%", opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0.5 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-[#0A0A0F] border-l border-white/10 h-full overflow-y-auto flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-semibold text-white">Chi tiết Request</h3>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-[#A1A1AA] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Status & Time */}
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedLog.status_code >= 500 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    selectedLog.status_code >= 400 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}>
                    {selectedLog.status_code}
                  </span>
                  <span className="text-[#A1A1AA] text-sm">
                    {new Date(selectedLog.timestamp + (!selectedLog.timestamp.includes('Z') ? 'Z' : '')).toLocaleString("vi-VN")}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-xs text-[#71717A] uppercase tracking-wider block">Path</label>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedLog.path)}
                        className="text-[10px] text-[#818CF8] hover:text-white transition-colors"
                      >
                        COPY
                      </button>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded p-3 text-sm text-[#D4D4D8] break-all font-mono">
                      <span className="text-[#818CF8] font-bold mr-2">{selectedLog.method}</span>
                      {selectedLog.path}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-xs text-[#71717A] uppercase tracking-wider block">User Email</label>
                      </div>
                      <div className="text-sm text-white break-all font-mono">
                        {selectedLog.user_email || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-xs text-[#71717A] uppercase tracking-wider block">IP Address</label>
                        <button 
                          onClick={() => navigator.clipboard.writeText(selectedLog.ip_address || '')}
                          className="text-[10px] text-[#818CF8] hover:text-white transition-colors"
                        >
                          COPY
                        </button>
                      </div>
                      <div className="text-sm text-white break-all font-mono">{selectedLog.ip_address || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#71717A] uppercase tracking-wider block mb-1">Latency</label>
                      <div className="text-sm text-white">{selectedLog.latency_ms?.toFixed(2) || selectedLog.latency_ms} ms</div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-xs text-[#71717A] uppercase tracking-wider block">User ID</label>
                      </div>
                      <div className="text-sm text-white break-all font-mono">{selectedLog.user_id ? `${selectedLog.user_id.slice(0, 16)}...` : 'N/A'}</div>
                    </div>
                  </div>

                  {selectedLog.error_message && (
                    <div>
                      <label className="text-xs text-[#71717A] uppercase tracking-wider block mb-1 text-red-400">Error Message</label>
                      <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-400 break-all">
                        {selectedLog.error_message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
