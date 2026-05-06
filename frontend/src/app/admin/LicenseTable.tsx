"use client";

import { FadeIn } from "@/components/motion";
import { motion } from "framer-motion";

export interface License {
  id: string;
  code: string;
  tier: string;
  duration_days: number;
  is_used: boolean;
  used_by_email: string | null;
  created_at: string;
  used_at: string | null;
}

interface Props {
  licenses: License[];
  onDelete: (id: string) => void;
}

export default function LicenseTable({ licenses, onDelete }: Props) {
  return (
    <FadeIn delay={0.2} className="lg:col-span-2 xl:col-span-3">
      <div className="aether-glass-wrapper rounded-[24px] h-full">
        <div className="aether-glass p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#818CF8] flex items-center gap-3">
              <span className="w-4 h-[1px] bg-[#818CF8]/50"></span>
              Kho dữ liệu License
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-[#A1A1AA] bg-white/5 px-2 py-1 rounded-sm border border-white/10">
              Total: {licenses.length}
            </span>
          </div>

          {licenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-[16px]">
              <svg className="w-12 h-12 text-[#A1A1AA] mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5m6 0v2a3 3 0 0 1-6 0v-2m6 0H9"/></svg>
              <p className="text-[10px] uppercase tracking-widest text-[#A1A1AA]">Hệ thống chưa ghi nhận license nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-[9px] uppercase tracking-widest text-[#A1A1AA] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-medium">Mã truy cập (Key)</th>
                    <th className="py-3 px-4 font-medium">Cấp độ</th>
                    <th className="py-3 px-4 font-medium">Thời hạn</th>
                    <th className="py-3 px-4 font-medium">Trạng thái</th>
                    <th className="py-3 px-4 font-medium">Người sử dụng</th>
                    <th className="py-3 px-4 font-medium">Ngày tạo / Dùng</th>
                    <th className="py-3 px-4 font-medium text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-light">
                  {licenses.map((lic, i) => (
                    <motion.tr
                      key={lic.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-300 font-mono bg-black/40 px-2 py-1 rounded border border-white/5">
                            {lic.code}
                          </code>
                          <button onClick={() => navigator.clipboard.writeText(lic.code)} className="w-9 h-9 inline-flex items-center justify-center text-[#A1A1AA] hover:text-[#6366F1] rounded hover:bg-white/5 transition-colors" title="Copy">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${lic.tier === "pro" ? "bg-[#818CF8]/10 text-[#818CF8] border-[#818CF8]/30" : "bg-purple-500/10 text-purple-400 border-purple-500/30"}`}>
                          {lic.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#D4D4D8]">{lic.duration_days} ngày</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${lic.is_used ? 'bg-gray-500' : 'bg-[#6366F1] shadow-[0_0_5px_rgba(99,102,241,0.8)]'}`}></span>
                          <span className={`text-[9px] uppercase tracking-widest ${lic.is_used ? 'text-[#A1A1AA]' : 'text-[#6366F1]'}`}>
                            {lic.is_used ? "Đã dùng" : "Sẵn sàng"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#A1A1AA] truncate max-w-[200px] xl:max-w-[300px]">
                        {lic.used_by_email || "—"}
                      </td>
                      <td className="py-3 px-4 text-[10px] text-[#A1A1AA]">
                        <div>Tạo: {new Date(lic.created_at).toLocaleDateString("vi-VN")}</div>
                        {lic.used_at && <div className="mt-0.5 text-[#D4D4D8]">Dùng: {new Date(lic.used_at).toLocaleDateString("vi-VN")}</div>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => onDelete(lic.id)} className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2.5 rounded transition-colors border border-red-500/30 min-h-[44px] inline-flex items-center">
                          Thu hồi / Xóa
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
