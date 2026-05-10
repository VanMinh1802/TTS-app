"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion";
import { apiRequest } from "@/lib/api-client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RequireRole } from "@/features/auth";
import { notificationService } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import LicenseGenerator from "./LicenseGenerator";
import LicenseTable, { type License } from "./LicenseTable";

export default function AdminPage() {
  const t = useT();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [genCount, setGenCount] = useState(5);
  const [genTier, setGenTier] = useState("pro");
  const [genDays, setGenDays] = useState(365);
  const [generating, setGenerating] = useState(false);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activationLogs, setActivationLogs] = useState<any[]>([]);
  const [showSuccessOnly, setShowSuccessOnly] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadLicenses();
    loadActivationLogs();
  }, [showSuccessOnly]);

  const loadLicenses = async () => {
    try { const data = await apiRequest<License[]>("/admin/licenses", { cache: "no-store" }); setLicenses(data); } catch {}
  };

  const loadActivationLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (showSuccessOnly) params.set("success_only", "true");
      const data = await apiRequest<any[]>(`/admin/activation-logs?${params}`, { cache: "no-store" });
      setActivationLogs(data);
    } catch {} finally { setLoadingLogs(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true); setNewKeys([]);
    try {
      const keys = await apiRequest<string[]>("/admin/licenses/generate", {
        method: "POST", body: JSON.stringify({ count: genCount, tier: genTier, duration_days: genDays }),
      });
      setNewKeys(keys);
      await loadLicenses();
    } catch {} finally { setGenerating(false); }
  };

  const copyAll = () => { navigator.clipboard.writeText(newKeys.join("\n")); };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiRequest(`/admin/licenses/${confirmDeleteId}`, { method: "DELETE", allowEmpty: true });
      await loadLicenses();
      notificationService.notify({ severity: "success", title: t.admin.licenseDeletedTitle, message: t.admin.licenseDeletedMsg });
      setConfirmDeleteId(null);
    } catch (e) {
      notificationService.notify({ severity: "error", title: t.admin.licenseDeleteErrorTitle, message: t.admin.licenseDeleteErrorMsg });
      setConfirmDeleteId(null);
    }
  };

  return (
    <RequireRole roles={['admin']}>
      <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
        <div className="absolute inset-0 pointer-events-none aether-bg-gradient"></div>
        <main className="max-w-7xl w-full mx-auto px-6 relative z-10">
          <FadeIn>
            <div className="mb-12">
              <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
                {t.admin.systemLicensing}
              </h2>
              <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight mb-4 font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">{t.admin.licenseManagement}</h1>
              <p className="text-xs font-light text-[#A1A1AA] uppercase tracking-widest">
                SYSTEM ADMINISTRATION / ACCESS TOKENS
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <LicenseGenerator
              genCount={genCount}
              setGenCount={setGenCount}
              genTier={genTier}
              setGenTier={setGenTier}
              genDays={genDays}
              setGenDays={setGenDays}
              generating={generating}
              onGenerate={handleGenerate}
              newKeys={newKeys}
              onCopyAll={copyAll}
            />

            <LicenseTable licenses={licenses} onDelete={handleDelete} />
          </div>

          {/* Activation Logs */}
          <div className="mt-12">
            <FadeIn delay={0.2}>
              <div className="aether-glass-wrapper rounded-[24px]">
                <div className="aether-glass rounded-[24px] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">{t.admin.activationLogs}</h2>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-[11px] text-[#A1A1AA] cursor-pointer">
                        <input type="checkbox" checked={showSuccessOnly} onChange={e => setShowSuccessOnly(e.target.checked)} className="accent-[#6366F1]" />
                        {t.admin.onlySuccess}
                      </label>
                      <button onClick={loadActivationLogs} disabled={loadingLogs} className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8] hover:text-white transition-colors">
                        {loadingLogs ? t.common.loading : t.admin.refresh}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{t.admin.colTime}</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{t.admin.colUserId}</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{t.admin.colCodeHash}</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{t.admin.colIp}</th>
                          <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{t.admin.colResult}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activationLogs.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-xs text-[#71717A]">{t.admin.noData}</td></tr>
                        ) : (
                          activationLogs.map((log: any) => (
                            <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-3 text-[11px] text-[#A1A1AA] font-mono">
                                {new Date(log.created_at).toLocaleString("vi-VN")}
                              </td>
                              <td className="py-3 px-3 text-[11px] text-[#D4D4D8] font-mono">
                                {log.user_id?.slice(0, 8) ?? "—"}...
                              </td>
                              <td className="py-3 px-3 text-[11px] text-[#71717A] font-mono">{log.code_hash}</td>
                              <td className="py-3 px-3 text-[11px] text-[#A1A1AA]">{log.ip_address || "—"}</td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  log.success ? "text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30" : "text-red-400 bg-red-500/10 border border-red-500/30"
                                }`}>
                                  {log.success ? "OK" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </main>
      </div>
      <ConfirmModal
        open={!!confirmDeleteId}
        title={t.admin.confirmDeleteTitle}
        message={t.admin.confirmDeleteMsg}
        confirmLabel={t.common.delete}
        variant="danger"
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
    </RequireRole>
  );
}
