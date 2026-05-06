"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { useAuth } from "@/features/auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || user.email.split("@")[0]);
    }
  }, [user]);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setGeminiKey(savedKey);
  }, []);

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setTestResult({ ok: false, message: "Vui lòng nhập API Key trước." });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      await model.generateContent("Say 'ok'");
      setTestResult({ ok: true, message: "API Key hoạt động!" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
        setTestResult({ ok: false, message: "API Key không hợp lệ. Kiểm tra lại." });
      } else if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        setTestResult({ ok: false, message: "API Key hết hạn mức sử dụng (quota)." });
      } else {
        setTestResult({ ok: false, message: `Lỗi: ${msg.slice(0, 100)}` });
      }
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", geminiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <main className="max-w-3xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="mb-10">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              Cấu hình Hệ thống
            </h2>
            <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">Cài đặt Tài khoản</h1>
          </div>
        </FadeIn>

        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <div className="aether-glass-wrapper rounded-[24px]">
              <div className="aether-glass rounded-[24px] p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6366F1] to-[#C968F7] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">Hồ sơ Cá nhân</h2>
                    <p className="text-xs text-[#A1A1AA]">{email}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Họ và tên</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-light text-sm text-[#D4D4D8] outline-none cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        value={name}
                        disabled
                      />
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 font-light text-sm text-[#71717A] outline-none cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        value={email}
                        disabled
                      />
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="aether-glass-wrapper rounded-[24px]">
              <div className="aether-glass rounded-[24px] p-8">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8] mb-5">Cấu hình AI (LLM)</h2>
                  <div className="space-y-3 mb-6 p-4 rounded-[16px] border border-[#6366F1]/20 bg-[#6366F1]/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8]">Cách lấy API Key</p>
                    <ol className="space-y-1.5 text-[11px] text-[#A1A1AA] font-light leading-relaxed">
                      <li>1. Truy cập <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:underline">Google AI Studio</a></li>
                      <li>2. Chọn <strong>Create API Key</strong> → chọn project (hoặc tạo mới)</li>
                      <li>3. Copy key và dán vào ô bên dưới → bấm <strong>Lưu cấu hình</strong></li>
                      <li>4. (Tùy chọn) Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:underline">Google Cloud Console</a> → cài giới hạn HTTP Referrer để bảo mật</li>
                    </ol>
                  </div>
                  <div className="space-y-1.5 mb-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 font-light text-sm text-white placeholder:text-[#A1A1AA]/50 outline-none focus:border-[#818CF8]/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      placeholder="AIzaSy..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-white/5 transition-all"
                    >
                      {showKey ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#71717A] font-light leading-relaxed">
                    Key được lưu trên trình duyệt (localStorage), dùng cho Sửa chính tả, Kiểm tra phát âm và Chia đoạn trong Studio.
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-white/[0.06]">
                  <button onClick={handleSave} className="aether-btn aether-btn-primary px-8 py-3 text-[10px] font-bold uppercase tracking-widest">
                    Lưu cấu hình
                  </button>
                  <button
                    onClick={handleTestKey}
                    disabled={testingKey}
                    className="px-6 py-3 rounded-full border border-[#818CF8]/30 bg-[#818CF8]/10 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest hover:bg-[#818CF8]/20 disabled:opacity-50 transition-all"
                  >
                    {testingKey ? "Đang kiểm tra..." : "Kiểm tra Key"}
                  </button>
                  <AnimatePresence>
                    {saved && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[#22C55E] text-xs font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Đã lưu
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
                <AnimatePresence>
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-4 rounded-[12px] border p-4 text-xs font-medium ${
                        testResult.ok
                          ? "border-green-500/20 bg-green-500/5 text-green-400"
                          : "border-red-500/20 bg-red-500/5 text-red-400"
                      }`}
                    >
                      {testResult.ok ? (
                        <span>✓ {testResult.message}</span>
                      ) : (
                        <span>✗ {testResult.message}</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
