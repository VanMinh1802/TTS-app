"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "@/features/auth/api/auth-api";
import { useNotifications } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import { motion } from "framer-motion";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (credentialResponse: { access_token?: string; credential?: string }) => {
      setLoading(true);
      setError("");

      const cred = credentialResponse.access_token || credentialResponse.credential;
      if (!cred) {
        setError(t.login.noGoogleInfo);
        notify({ severity: "error", title: t.login.noCredentialTitle, message: t.login.noCredentialMsg, source: "auth" });
        setLoading(false);
        return;
      }

      try {
        await loginWithGoogle(cred);
        notify({ severity: "success", title: t.login.authSuccessTitle, message: t.login.authSuccessMsg, source: "auth" });
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl && callbackUrl.startsWith("/")) {
          router.push(callbackUrl);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t.login.authFailed;
        setError(message);
        notify({ severity: "error", title: t.login.authErrorTitle, message, source: "auth" });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError(t.login.googleNoResponse);
    },
  });

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 relative text-[#F4F4F5] overflow-hidden font-light">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)' }}></div>

      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-8 left-8 z-20"
      >
        <Link
          href="/"
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#6366F1]/30 bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 text-[10px] uppercase tracking-widest text-[#818CF8] hover:text-white hover:border-[#6366F1]/50 hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.08)] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
        >
          <motion.svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ x: 0 }}
            whileHover={{ x: -3 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </motion.svg>
          <span className="relative">
            Trở về
            <span className="absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-[#6366F1] to-[#C968F7] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-1 mb-5">
            {["T", "2", "V"].map((letter, i) => (
              <motion.div
                key={letter}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#C968F7] flex items-center justify-center"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.12, ease: [0.4, 0, 0.2, 1] }}
              >
                <span className="text-white font-bold text-[12px]">{letter}</span>
              </motion.div>
            ))}
          </div>
          <h1 className="text-3xl leading-tight py-0 tracking-tight mb-2 font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
            TYPE2VIBE
          </h1>
          <p className="text-[11px] font-light text-[#A1A1AA]">
            {t.login.continuePrompt}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="aether-glass-wrapper rounded-[24px]"
        >
          <div className="aether-glass p-8 md:p-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.35, ease: [0.4, 0, 0.2, 1], type: "spring", stiffness: 200 }}
              className="w-14 h-14 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            >
              <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-base font-light tracking-wide text-[#F4F4F5] mb-1"
            >
              {t.login.welcomeBack}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-8"
            >
              {t.login.googleSignIn}
            </motion.p>

            <motion.button
              onClick={() => login()}
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border text-xs font-medium tracking-wider transition-all duration-200 min-h-[44px] ${
                loading
                  ? "bg-white/5 border-white/10 text-[#A1A1AA] cursor-wait"
                  : "bg-white/5 border-white/10 text-[#F4F4F5] hover:bg-white/10 hover:border-white/20 hover:text-white"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                  <span>{t.login.authenticating}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>{t.login.signInGoogle}</span>
                </>
              )}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-4 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-[10px] font-medium uppercase tracking-widest text-red-400 text-center flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                {error}
              </motion.div>
            )}

            {/* Footer links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="w-full flex items-center justify-center gap-6 mt-8 pt-6 border-t border-white/[0.06]"
            >
              <span className="text-[10px] font-light tracking-wider text-[#71717A] pb-0.5">
                {t.login.help}
              </span>
              <span className="text-[10px] font-light tracking-wider text-[#71717A] pb-0.5">
                {t.login.privacy}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mt-8"
        >
          <p className="text-[10px] font-light text-[#A1A1AA] tracking-wider">
            {t.login.agreeToTerms}{" "}
            <span className="text-[#71717A] border-b border-white/10 pb-0.5">{t.login.termsOfService}</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const t = useT();

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-[#F4F4F5] font-light">
        <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full border-red-500/20">
          <div className="aether-glass p-8 bg-red-950/10 text-center">
            <svg className="w-10 h-10 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-red-400 mb-2">{t.login.configErrorTitle}</h2>
            <p className="font-light text-sm text-[#D4D4D8] leading-relaxed">
              {t.login.missingClientId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
