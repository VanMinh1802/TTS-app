"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion";
import { apiRequest } from "@/lib/api-client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RequireRole } from "@/features/auth";
import { notificationService } from "@/shared/notifications/notification-store";
import LicenseGenerator from "./LicenseGenerator";
import LicenseTable, { type License } from "./LicenseTable";

export default function AdminPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [genCount, setGenCount] = useState(5);
  const [genTier, setGenTier] = useState("pro");
  const [genDays, setGenDays] = useState(365);
  const [generating, setGenerating] = useState(false);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try { const data = await apiRequest<License[]>("/admin/licenses", { cache: "no-store" }); setLicenses(data); } catch {}
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
      notificationService.notify({ severity: "success", title: "Thành công", message: "Đã xóa license thành công." });
      setConfirmDeleteId(null);
    } catch (e) {
      notificationService.notify({ severity: "error", title: "Lỗi", message: "Không thể xóa license." });
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
                Cấp phép Hệ thống
              </h2>
              <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight mb-4 font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">Quản trị License</h1>
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
        </main>
      </div>
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa/thu hồi mã license này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
    </RequireRole>
  );
}
