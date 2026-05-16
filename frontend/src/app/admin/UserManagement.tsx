"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { apiRequest } from "@/lib/api-client";
import { notificationService } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import { Ban, ShieldCheck } from "lucide-react";

export default function UserManagement() {
  const t = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: "10" });
      if (search.length >= 2) params.set("search", search);
      const data = await apiRequest<any>(`/admin/users?${params}`, { cache: "no-store" });
      setUsers(data.items);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search]);

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}/toggle-active`, { method: "POST" });
      notificationService.notify({ severity: "success", title: "Thành công", message: currentStatus ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản" });
      loadUsers();
    } catch (e: any) {
      notificationService.notify({ severity: "error", title: "Lỗi", message: e.message || "Không thể thay đổi trạng thái" });
    }
  };

  return (
    <div className="aether-glass-wrapper rounded-[24px]">
      <div className="aether-glass rounded-[24px] p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Quản lý Tài khoản</h2>
            <p className="text-xs text-[#A1A1AA]">Tổng số: {total} người dùng</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Tìm email hoặc tên..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1]/50 w-full md:w-64"
            />
            <button onClick={() => loadUsers()} disabled={loading} className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8] hover:text-white transition-colors shrink-0">
              {loading ? "..." : "LÀM MỚI"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Email / Name</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Gói (Tier)</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Ngày tham gia</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Trạng thái</th>
                <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-[#71717A]">Không tìm thấy người dùng</td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {users.map((user: any, index: number) => (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                    <td className="py-3 px-3">
                      <div className="text-[13px] font-medium text-white">{user.email}</div>
                      <div className="text-[11px] text-[#A1A1AA]">{user.name} {user.is_admin ? <span className="text-[#6366F1] font-bold ml-1">(ADMIN)</span> : ""}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[11px] font-bold uppercase text-[#D4D4D8]">{user.subscription_tier}</div>
                      {user.subscription_expires_at && (
                        <div className="text-[10px] text-[#71717A]">Hết hạn: {new Date(user.subscription_expires_at + (!user.subscription_expires_at.includes('Z') ? 'Z' : '')).toLocaleDateString("vi-VN")}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[#A1A1AA] font-mono">
                      {new Date(user.created_at + (!user.created_at.includes('Z') ? 'Z' : '')).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        user.is_active ? "text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30" : "text-red-400 bg-red-500/10 border border-red-500/30"
                      }`}>
                        {user.is_active ? "ACTIVE" : "BANNED"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!user.is_admin && (
                          <button 
                            onClick={() => toggleActive(user.id, user.is_active)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-widest transition-all ${
                              user.is_active 
                                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40" 
                                : "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/20 hover:border-[#22C55E]/40"
                            }`}
                          >
                            {user.is_active ? (
                              <><Ban className="w-3.5 h-3.5" /><span>Khóa</span></>
                            ) : (
                              <><ShieldCheck className="w-3.5 h-3.5" /><span>Mở Khóa</span></>
                            )}
                          </button>
                        )}
                      </div>
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
            disabled={users.length < 10} 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-[11px] uppercase tracking-widest bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            SAU
          </button>
        </div>
      </div>
    </div>
  );
}
