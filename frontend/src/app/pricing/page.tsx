"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { getCurrentUser } from "@/features/auth/api/auth-api";
import { notificationService } from "@/shared/notifications/notification-store";

const faqs = [
  { q: "Tôi có thể hủy gói bất cứ lúc nào không?", a: "Có, bạn có thể hủy gói và không bị ràng buộc. Dịch vụ sẽ tiếp tục hoạt động đến hết chu kỳ thanh toán hiện tại." },
  { q: "Dữ liệu của tôi có an toàn không?", a: "Toàn bộ âm thanh và cấu hình được mã hóa end-to-end trên hạ tầng Cloudflare R2 riêng biệt. Chúng tôi cam kết tuyệt đối không sử dụng dữ liệu của bạn để huấn luyện mô hình." },
  { q: "Có hỗ trợ thanh toán qua ví điện tử không?", a: "Hệ thống đang tích hợp thanh toán qua chuyển khoản ngân hàng và mã kích hoạt (License Code)." },
];

export default function PricingPage() {
  const [showProModal, setShowProModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userTier, setUserTier] = useState("free");
  const [isYearly, setIsYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then(u => {
      setUserEmail(u.email);
      setUserTier(u.subscription_tier || "free");
    }).catch(() => {
      notificationService.notify({ severity: "error", title: "Lỗi", message: "Không thể tải thông tin người dùng." });
    });
  }, []);

  const price = isYearly ? "99k" : "19k";
  const period = isYearly ? "/ năm" : "/ tháng";
  const amount = isYearly ? 99000 : 19000;
  const planName = isYearly ? "Gói Chuyên Nghiệp - 1 Năm" : "Gói Chuyên Nghiệp - 1 Tháng";
  const isPro = userTier !== "free" && userTier !== "";

  const plans = [
    {
      name: "CƠ BẢN",
      price: "0₫",
      period: "mãi mãi",
      badge: null,
      features: [
        { text: "5,000 ký tự / tháng", icon: "check" },
        { text: "100 API calls / ngày", icon: "check" },
        { text: "100MB lưu trữ", icon: "check" },
        { text: "10+ giọng nói", icon: "check" },
        { text: "Từ điển tuỳ chỉnh", icon: "check" },
        { text: "Tải file MP3", icon: "check" },
      ],
      cta: isPro ? "Gói cơ bản" : "Đang sử dụng",
      disabled: true,
    },
    {
      name: "CHUYÊN NGHIỆP",
      price: price,
      period: period,
      badge: "PHỔ BIẾN",
      features: [
        { text: "200,000 ký tự / tháng", icon: "star" },
        { text: "5,000 API calls / ngày", icon: "star" },
        { text: "5GB lưu trữ Cloud (R2)", icon: "cloud" },
        { text: "10+ giọng nói", icon: "star" },
        { text: "Từ điển tuỳ chỉnh", icon: "check" },
        { text: "Đồng bộ đám mây", icon: "cloud" },
        { text: "Tải file MP3 & WAV (lossless)", icon: "star" },
        { text: "Ưu tiên hỗ trợ", icon: "star" },
      ],
      cta: isPro ? "Đang sử dụng" : "Nâng cấp Pro",
      disabled: isPro,
    }
  ];

  const featureIcons: Record<string, React.ReactNode> = {
    check: <svg className="w-4 h-4 shrink-0 text-[#6366F1]/70 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>,
    star: <svg className="w-4 h-4 shrink-0 text-[#C968F7]/80 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>,
    cloud: <svg className="w-4 h-4 shrink-0 text-[#6366F1]/70 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>,
  };

  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-8">
          <FadeIn>
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center justify-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              Phân bổ Tài nguyên
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
            </h2>
            <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">Bảng giá Dịch vụ</h1>
            <p className="text-xs font-light text-[#A1A1AA] max-w-xl mx-auto mt-2">Lựa chọn cấu hình phù hợp với quy mô và nhu cầu của bạn.</p>
          </FadeIn>
        </div>

        {/* Toggle */}
        <FadeIn delay={0.1}>
          <div className="flex justify-center mb-10">
            <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center relative">
              <button onClick={() => setIsYearly(false)} className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${isYearly ? 'text-[#D4D4D8] hover:text-white' : 'text-white'}`}>1 Tháng</button>
              <button onClick={() => setIsYearly(true)} className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${!isYearly ? 'text-[#D4D4D8] hover:text-white' : 'text-white'}`}>
                1 Năm
                <span className="absolute -top-3 -right-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">-17%</span>
              </button>
              <div
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-gradient-to-r from-[#6366F1] to-[#C968F7] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)] z-0 transition-all duration-300 ease-out"
                style={{ transform: `translateX(${isYearly ? '100%' : '0'})` }}
              />
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + idx * 0.1 }}
              className={`aether-glass-wrapper rounded-[24px] transition-all duration-300 hover:-translate-y-1 ${
                plan.badge ? 'ring-1 ring-[#6366F1]/40 shadow-[0_0_40px_rgba(99,102,241,0.12)]' : ''
              }`}
            >
              <div className="aether-glass rounded-[24px] p-8 h-full flex flex-col relative overflow-hidden">
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] to-[#C968F7]" />
                )}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8]">{plan.name}</h2>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl md:text-5xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{plan.period}</span>}
                    </div>
                  </div>
                  {plan.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-[#6366F1]/15 to-[#C968F7]/15 border border-[#6366F1]/30 text-[#818CF8] shadow-[0_0_12px_rgba(99,102,241,0.1)]">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent mb-6" />

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.15 + i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      {featureIcons[f.icon]}
                      <span className="font-light text-sm text-[#D4D4D8]">{f.text}</span>
                    </motion.li>
                  ))}
                </ul>

                {plan.disabled ? (
                  <button disabled className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest cursor-not-allowed">
                    {plan.cta}
                  </button>
                ) : (
                  <button onClick={() => setShowProModal(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1]/20 to-[#C968F7]/20 border border-[#6366F1]/40 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest hover:from-[#6366F1]/30 hover:to-[#C968F7]/30 hover:text-white hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all">
                    {plan.cta}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <FadeIn delay={0.4}>
          <div className="aether-glass-wrapper rounded-[24px] max-w-4xl mx-auto">
            <div className="aether-glass rounded-[24px] p-8 md:p-10">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8] mb-6">Câu hỏi thường gặp</h2>
              <div className="space-y-1">
                {faqs.map((item, i) => (
                  <div key={i} className="border-b border-white/[0.04] last:border-none">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left group">
                      <span className="text-sm font-medium text-[#D4D4D8] group-hover:text-white transition-colors">{item.q}</span>
                      <motion.svg className="w-4 h-4 shrink-0 text-[#A1A1AA]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </motion.svg>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                          <p className="text-sm font-light text-[#A1A1AA] leading-relaxed pb-4 pl-0">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      {/* Pro Upgrade Modal */}
      <AnimatePresence>
        {showProModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowProModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="aether-glass-wrapper rounded-[24px] w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="aether-glass rounded-[24px] p-8 relative">
                <button onClick={() => setShowProModal(false)} aria-label="Đóng" className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <h3 className="text-lg font-semibold text-white mb-1">Nâng cấp {planName}</h3>
                <p className="text-xs text-[#A1A1AA] mb-6">Quét mã QR hoặc chuyển khoản</p>
                <div className="flex flex-col sm:flex-row gap-5 items-center mb-6">
                  <div className="bg-white p-2 rounded-xl shrink-0">
                    <img src={`https://img.vietqr.io/image/VPB-0378438614-compact2.png?amount=${amount}&addInfo=T2V%20${encodeURIComponent(userEmail || "email")}`} alt="VietQR" className="w-36 h-36 md:w-40 md:h-40" />
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-sm w-full space-y-2.5">
                    <div><span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Ngân hàng</span><span className="font-medium text-white">VP Bank</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">STK</span><span className="font-mono text-[#D4D4D8]">0378438614</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Số tiền</span><span className="font-semibold text-white">{amount.toLocaleString()} VND</span></div>
                    <div><span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Nội dung</span><span className="font-mono text-[#818CF8] break-all text-xs">T2V {userEmail || "<Email>"}</span></div>
                  </div>
                </div>
                <p className="text-xs text-[#A1A1AA] mb-4">Mã kích hoạt sẽ gửi vào email sau 5-10 phút.</p>
                <Link href="/activate" className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8] hover:text-[#6366F1] transition-colors">Đã có mã? Kích hoạt ngay →</Link>
                <div className="pt-4 mt-4 border-t border-white/[0.06] text-[10px] text-[#71717A] flex flex-wrap gap-x-4 gap-y-1">
                  <a href="https://zalo.me/0378438614" target="_blank" rel="noopener noreferrer" className="hover:text-[#818CF8] transition-colors">Zalo hỗ trợ</a>
                  <a href="https://www.facebook.com/nvm180220/" target="_blank" rel="noopener noreferrer" className="hover:text-[#818CF8] transition-colors">Fanpage</a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
