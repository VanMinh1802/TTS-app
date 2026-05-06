"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { apiRequest } from "@/lib/api-client";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import Link from "next/link";

function ActivateForm() {
  const { status, user } = useAuth();
  const [code, setCode] = useState("");
  const [actStatus, setActStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) setCode(codeParam);
    const storedCode = sessionStorage.getItem("pending_license_code");
    if (storedCode && !codeParam) { setCode(storedCode); sessionStorage.removeItem("pending_license_code"); }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated' && user) {
      setUserEmail(user.email);
    } else if (status === 'unauthenticated') {
      const codeParam = searchParams.get("code");
      if (codeParam) sessionStorage.setItem("pending_license_code", codeParam);
      router.push("/login?redirect=/activate");
    }
  }, [status, user, searchParams, router]);

  const handleActivate = async () => {
    if (!code.trim()) return;
    setActStatus("loading");
    try {
      const data = await apiRequest<{ success: boolean; tier: string; message: string }>("/subscriptions/activate", {
        method: "POST", body: JSON.stringify({ code: code.trim() })
      });
      setActStatus("success");
      setMessage(data.message || `Kích hoạt thành công — Gói ${data.tier.toUpperCase()}`);
      setCode("");
    } catch (err) {
      setActStatus("error");
      setMessage(err instanceof Error ? err.message : "Mã không hợp lệ hoặc đã được sử dụng");
    }
  };

  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light flex items-center justify-center pt-16 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)' }} />
      <main className="max-w-md w-full mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center justify-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              Kích hoạt Quyền truy cập
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
            </h2>
            <h1 className="text-3xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">Kích hoạt License</h1>
            {userEmail && (
              <p className="text-[10px] font-light text-[#A1A1AA] mt-2">
                Tài khoản: <span className="text-[#D4D4D8]">{userEmail}</span>
              </p>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="aether-glass-wrapper rounded-[24px] mb-6">
            <div className="aether-glass rounded-[24px] p-8">
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-2">
                  Mã kích hoạt
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setActStatus("idle"); }}
                    placeholder="PRO-365-XXXXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 font-mono text-center tracking-[0.15em] text-sm text-white placeholder:text-[#A1A1AA]/30 outline-none focus:border-[#818CF8]/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                  {code && (
                    <button onClick={() => setCode("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleActivate}
                disabled={!code.trim() || actStatus === "loading"}
                className="w-full aether-btn aether-btn-primary py-3.5 min-h-[44px] text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:!shadow-none flex items-center justify-center gap-2"
              >
                {actStatus === "loading" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1-.43-1.563A6 6 0 1121.75 8.25z"/></svg>
                    Kích hoạt
                  </>
                )}
              </button>

              <AnimatePresence>
                {actStatus === "success" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 overflow-hidden">
                    <div className="p-4 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20 text-[10px] font-bold uppercase tracking-widest text-[#22C55E] text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {message}
                    </div>
                  </motion.div>
                )}
                {actStatus === "error" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 overflow-hidden">
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest text-red-400 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      {message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="aether-glass-wrapper rounded-[24px]">
            <div className="aether-glass rounded-[24px] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8] mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
                Hướng dẫn
              </h3>
              <ul className="space-y-3 text-[11px] font-light text-[#A1A1AA] leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-[#6366F1] mt-0.5 shrink-0">1.</span>
                  <span>Mã có định dạng <code className="bg-white/5 px-1.5 py-0.5 border border-white/5 rounded-md font-mono text-[10px]">PRO-365-XXXXXXXX</code></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#6366F1] mt-0.5 shrink-0">2.</span>
                  <span>Mỗi mã chỉ <strong className="text-[#D4D4D8]">dùng một lần</strong> cho một tài khoản duy nhất.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#6366F1] mt-0.5 shrink-0">3.</span>
                  <span>Quyền truy cập được kích hoạt ngay sau khi xác thực thành công.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#6366F1] mt-0.5 shrink-0">4.</span>
                  <span>Hỗ trợ qua <a href="https://zalo.me/0378438614" target="_blank" rel="noreferrer" className="text-[#D4D4D8] underline hover:text-[#818CF8] transition-colors">Zalo (0378438614)</a></span>
                </li>
              </ul>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="text-center text-[10px] text-[#A1A1AA] mt-6">
            Chưa có mã? <Link href="/pricing" className="text-[#818CF8] hover:text-[#6366F1] underline transition-colors">Mua gói Pro</Link>
          </p>
        </FadeIn>
      </main>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    }>
      <ActivateForm />
    </Suspense>
  );
}
