"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { apiRequest } from "@/lib/api-client";
import { useNotifications } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import { ApiKeyStats } from "./ApiKeyStats";
import { ApiKeyGuide } from "./ApiKeyGuide";
import { CreateKeyModal } from "./CreateKeyModal";
import type { ApiKeyCreateFormData } from "@/lib/validators";
import { RevokeConfirmModal } from "./RevokeConfirmModal";
import { NewKeyResultModal } from "./NewKeyResultModal";

interface APIKey {
  id: string;
  name: string;
  rate_limit: number;
  rate_limit_window: number;
  expires_at: string | null;
  scopes: string;
  total_requests: number;
  failed_requests: number;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

interface QuotaStatus {
  usage: {
    characters_this_month: number;
  };
}

export default function APIKeysPage() {
  const t = useT();
  const { notify } = useNotifications();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState<{ name: string; fullKey: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fetchData = async () => {
    try {
      const [keysRes, quotaRes] = await Promise.all([
        apiRequest<{ items: APIKey[] }>("/auth/api-keys"),
        apiRequest<QuotaStatus>("/quota")
      ]);
      setKeys(keysRes.items);
      setQuota(quotaRes);
    } catch (err) {
      console.error("Failed to fetch API Keys:", err);
      notify({ severity: "error", title: t.apiKeys.loadErrorTitle, message: t.apiKeys.loadErrorMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const totalRequests = keys.reduce((sum, k) => sum + k.total_requests, 0);
    const totalFailed = keys.reduce((sum, k) => sum + k.failed_requests, 0);
    const successRate = totalRequests > 0 ? ((totalRequests - totalFailed) / totalRequests) * 100 : 100;
    const activeKeys = keys.filter(k => k.is_active).length;
    return { totalRequests, successRate: successRate.toFixed(1), activeKeys, characters: quota?.usage.characters_this_month || 0 };
  }, [keys, quota]);

  const handleGenerate = async (data: ApiKeyCreateFormData) => {
    setIsGenerating(true);
    try {
      const res = await apiRequest<{ id: string; name: string; key: string }>("/auth/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: data.name, rate_limit: data.rateLimit })
      });
      setNewKeyData({ name: res.name, fullKey: res.key });
      setShowCreate(false);
      fetchData();
      notify({ severity: "success", title: t.apiKeys.createSuccessTitle, message: t.apiKeys.createSuccessMsg });
    } catch (err) {
      notify({ severity: "error", title: t.apiKeys.createErrorTitle, message: t.apiKeys.createErrorMsg });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!showConfirm) return;
    try {
      await apiRequest(`/auth/api-keys/${showConfirm}`, { method: "DELETE" });
      setKeys(prev => prev.map(k => k.id === showConfirm ? { ...k, is_active: false } : k));
      setShowConfirm(null);
      notify({ severity: "success", title: t.apiKeys.revokeSuccessTitle, message: t.apiKeys.revokeSuccessMsg });
    } catch (err) {
      notify({ severity: "error", title: t.apiKeys.revokeErrorTitle, message: t.apiKeys.revokeErrorMsg });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notify({ severity: "info", title: t.apiKeys.copied, message: label });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getRemainingDays = (expiry: string | null) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-4 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
                {t.apiKeys.systemAuth}
              </h2>
              <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">{t.apiKeys.heading}</h1>
              <p className="text-xs font-light text-[#A1A1AA] mt-2">{keys.length} key · {stats.activeKeys} active</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="aether-btn aether-btn-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              {t.apiKeys.createNew}
            </button>
          </div>
        </FadeIn>

        <ApiKeyStats stats={stats} />

        <FadeIn delay={0.2}>
          <div className="aether-glass-wrapper rounded-[24px]">
            <div className="aether-glass p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8] mb-5">{t.apiKeys.keyList}</h2>
              {loading ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-[#818CF8] border-t-transparent animate-spin" />
                </div>
              ) : keys.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl text-[#A1A1AA]">
                  <p className="text-xs font-bold uppercase tracking-widest">{t.apiKeys.empty}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {keys.map((key, i) => {
                    const daysLeft = getRemainingDays(key.expires_at);
                    return (
                      <motion.div
                        key={key.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06 }}
                        className={`p-5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                          !key.is_active
                            ? "opacity-50 border-white/5 bg-black/20"
                            : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-[15px] font-semibold text-white truncate">{key.name}</h3>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                key.is_active
                                  ? "bg-[#22C55E]/5 border-[#22C55E]/20 text-[#22C55E]"
                                  : "bg-red-500/5 border-red-500/20 text-red-400"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${key.is_active ? 'bg-[#22C55E]' : 'bg-red-400'}`} />
                                {key.is_active ? 'Active' : 'Revoked'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-[11px] font-mono text-[#D4D4D8] bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">
                                gva_****...****{key.id.slice(-4)}
                              </code>
                                <button
                                  onClick={() => copyToClipboard(key.id, t.apiKeys.keyIdCopied)}
                                  className="p-2 rounded-lg text-[#71717A] hover:text-[#D4D4D8] hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                                  title={t.apiKeys.copyKeyId}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-[#71717A]">
                              <span>Rate: {key.rate_limit}/{key.rate_limit_window === 60 ? 'min' : 's'}</span>
                              <span>{key.total_requests.toLocaleString()} requests</span>
                              {daysLeft !== null && (
                                <span className={daysLeft < 7 && key.is_active ? 'text-red-400' : ''}>
                                  · {daysLeft === 0 ? t.apiKeys.expiredToday : t.apiKeys.daysLeft.replace("{n}", String(daysLeft))}
                                </span>
                              )}
                              <span>· {formatDate(key.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => copyToClipboard(key.id, t.apiKeys.keyIdCopied)}
                              className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#D4D4D8] hover:bg-white/10 hover:text-white transition-all"
                            >
                              {t.apiKeys.copyId}
                            </button>
                            {key.is_active && (
                              <button
                                onClick={() => setShowConfirm(key.id)}
                                className="px-3 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all"
                              >
                                {t.apiKeys.revoke}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        <ApiKeyGuide />

        <CreateKeyModal show={showCreate} onClose={() => setShowCreate(false)} onGenerate={handleGenerate} isGenerating={isGenerating} />
        <RevokeConfirmModal show={showConfirm} onClose={() => setShowConfirm(null)} onRevoke={handleRevoke} />
        <NewKeyResultModal keyData={newKeyData} onClose={() => setNewKeyData(null)} onCopy={(text) => copyToClipboard(text, t.apiKeys.apiKeyCopied)} />
      </main>
    </div>
  );
}
