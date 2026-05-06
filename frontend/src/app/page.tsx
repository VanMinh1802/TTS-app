"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { FadeIn } from "@/components/motion";

const WebGLBackground = dynamic(
  () => import("@/components/ui/WebGLBackground").then((m) => m.WebGLBackground),
  { ssr: false }
);

export default function Home() {

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col relative bg-[var(--color-aether-bg)] text-[#F4F4F5] overflow-hidden font-light selection:bg-[#6366F1]/30">
      <div className="absolute inset-0 pointer-events-none z-0 aether-bg-gradient opacity-40" />
      <WebGLBackground />

      <main className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col pt-24 md:pt-[12vh] pb-6 px-6">
        <div className="flex flex-col items-center text-center w-full">
          <FadeIn delay={0.2}>
            <div className="aether-badge mb-10 font-bold">
              <div className="aether-badge-dot animate-pulse"></div>
              Nền tảng TTS tiếng Việt thế hệ mới
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <h1 className="text-5xl md:text-7xl lg:text-[90px] leading-[1.05] tracking-tight mb-8 max-w-4xl font-bold">
              <span className="bg-gradient-to-r from-[#6366F1] to-[#C968F7] bg-clip-text text-transparent">
                Tạo âm thanh.
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#6366F1] to-[#C968F7] bg-clip-text text-transparent">
                Không giới hạn.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.6}>
            <p className="text-base md:text-lg text-[#A1A1AA] max-w-2xl mb-12 leading-relaxed font-light">
              Mỗi câu chữ xứng đáng được nghe với giọng người thật. 
              <strong className="text-[#818CF8] font-light ml-1">Type2Vibe</strong> mang âm thanh tự nhiên đến nội dung của bạn.
            </p>
          </FadeIn>

          <FadeIn delay={0.8}>
            <motion.div
              className="flex justify-center mb-20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Link href="/login">
                <motion.button
                  className="aether-btn aether-btn-primary relative overflow-hidden"
                  whileHover={{ boxShadow: "0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(201,104,247,0.3)" }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span
                    className="flex items-center gap-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ✦ Khám phá Type2Vibe
                    <span className="inline-block">→</span>
                  </motion.span>
                </motion.button>
              </Link>
            </motion.div>
          </FadeIn>

          {/* Stats Row */}
          <div className="w-full max-w-3xl pt-16 border-t border-white/[0.06] flex justify-center gap-12 md:gap-24">
            <FadeIn delay={1.0}>
              <motion.div
                className="text-center"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl md:text-5xl font-bold mb-1 text-white bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
                  2.4M<span className="text-base font-bold opacity-70 ml-1">+</span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#A1A1AA]">Ký tự đã tạo</div>
              </motion.div>
            </FadeIn>
            <FadeIn delay={1.1}>
              <motion.div
                className="text-center"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl md:text-5xl font-bold mb-1 text-white bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
                  &lt;150<span className="text-base font-bold opacity-70 ml-1">ms</span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#A1A1AA]">Độ trễ TB</div>
              </motion.div>
            </FadeIn>
            <FadeIn delay={1.2}>
              <motion.div
                className="text-center"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl md:text-5xl font-bold mb-1 text-white bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
                  10<span className="text-base font-bold opacity-70 ml-1">+</span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#A1A1AA]">Giọng bản địa</div>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </main>

      <footer className="relative z-10 pt-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center py-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] order-2 md:order-1 mt-4 md:mt-0">
              © 2026 TYPE2VIBE.
            </p>
            <div className="flex items-center gap-8 order-1 md:order-2">
              <Link href="#" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#71717A] hover:text-[#818CF8] transition-colors">
                <span className="w-0 group-hover:w-3 h-px bg-[#818CF8] transition-all duration-300" />
                Điều khoản
              </Link>
              <Link href="#" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#71717A] hover:text-[#818CF8] transition-colors">
                <span className="w-0 group-hover:w-3 h-px bg-[#818CF8] transition-all duration-300" />
                Bảo mật
              </Link>
              <Link href="#" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#71717A] hover:text-[#818CF8] transition-colors">
                <span className="w-0 group-hover:w-3 h-px bg-[#818CF8] transition-all duration-300" />
                API
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
