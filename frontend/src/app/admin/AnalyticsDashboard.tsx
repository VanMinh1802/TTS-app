"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api-client";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>("/admin/analytics", { cache: "no-store" });
      setData(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="text-sm text-[#A1A1AA] py-8 text-center animate-pulse">Đang tải dữ liệu hệ thống...</div>;
  if (!data) return <div className="text-sm text-red-400 py-8 text-center">Không thể tải dữ liệu</div>;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <motion.div 
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Tổng Request" value={data.total_requests} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Tổng Users" value={data.total_users} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Request Hôm Nay" value={data.requests_today} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Độ trễ TB (ms)" value={data.average_latency_ms} />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Endpoints */}
        <div className="aether-glass-wrapper rounded-[24px]">
          <div className="aether-glass rounded-[24px] p-6 h-full">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#818CF8] mb-4">Top Endpoints</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {data.requests_by_endpoint.map((ep: any, idx: number) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[11px] text-[#D4D4D8] font-mono truncate max-w-[70%]">{ep.path}</span>
                    <span className="text-[11px] text-[#A1A1AA]">{ep.count} req</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="aether-glass-wrapper rounded-[24px]">
          <div className="aether-glass rounded-[24px] p-6 h-full">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#818CF8] mb-4">Top Users</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {data.top_users.map((u: any, idx: number) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[11px] text-[#D4D4D8] font-mono truncate max-w-[70%]">{u.email}</span>
                    <span className="text-[11px] text-[#A1A1AA]">{u.requests} req</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {data.top_users.length === 0 && <div className="text-[11px] text-[#71717A]">Chưa có dữ liệu</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="aether-glass-wrapper rounded-[20px]">
      <div className="aether-glass rounded-[20px] p-5">
        <h4 className="text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">{title}</h4>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
    </div>
  );
}
