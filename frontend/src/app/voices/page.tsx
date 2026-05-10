"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { UiSelect } from "@/components/ui/UiSelect";
import { notificationService } from "@/shared/notifications/notification-store";
import { useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  is_custom: boolean;
  is_active: boolean;
  is_premium: boolean;
  model_url?: string;
  config_url?: string;
  sample_url?: string;
}

export default function VoicesPage() {
  const t = useT();
  const { user } = useAuth();
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ language: "", gender: "" });
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const params = new URLSearchParams();
        if (filter.language) params.append("language", filter.language);
        if (filter.gender) params.append("gender", filter.gender);

        const response = await fetch(`${API_URL}/voices?${params}`);
        if (response.ok) {
          const data = await response.json();
          setVoices(data);
        }
      } catch (error) {
        console.error("Failed to fetch voices:", error);
        notificationService.notify({ severity: "error", title: t.voices.loadErrorTitle, message: t.voices.loadErrorMsg });
      } finally {
        setLoading(false);
      }
    };
    fetchVoices();
  }, [filter.language, filter.gender]);

  const previewVoice = useCallback((voice: Voice) => {
    if (selectedVoice === voice.id) {
      audioRef.current?.pause();
      setSelectedVoice(null);
      return;
    }
    if (voice.sample_url) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setSelectedVoice(voice.id);
      const audio = new Audio(voice.sample_url);
      audio.onended = () => { setSelectedVoice(null); audioRef.current = null; };
      audio.onerror = () => { setSelectedVoice(null); audioRef.current = null; };
      audioRef.current = audio;
      audio.play().catch(() => setSelectedVoice(null));
    }
  }, [selectedVoice]);

  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-4 pb-12">
      {/* Background radial gradient */}
      <div className="absolute inset-0 pointer-events-none aether-bg-gradient"></div>
      
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="mb-12">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              {t.voices.audioConfig}
            </h2>
            <h1 className="text-4xl md:text-5xl tracking-tight leading-tight py-0 mb-2 font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
              {t.voices.libraryHeading}
            </h1>
            <p className="text-xs font-light text-[#A1A1AA] uppercase tracking-widest">
              {t.voices.activeModelsLabel} {voices.length}
            </p>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <div className="aether-glass-wrapper rounded-[16px] mb-8">
            <div className="aether-glass p-4 flex gap-4 flex-wrap items-center">
              <UiSelect
                value={filter.language}
                onChange={(v) => setFilter({...filter, language: v})}
                options={[
                  { value: '', label: t.voices.allLanguages },
                  { value: 'vi', label: t.voices.langVi },
                  { value: 'en', label: t.voices.langEn },
                ]}
              />
              <UiSelect
                value={filter.gender}
                onChange={(v) => setFilter({...filter, gender: v})}
                options={[
                  { value: '', label: t.voices.allGenders },
                  { value: 'male', label: t.voices.genderMale },
                  { value: 'female', label: t.voices.genderFemale },
                  { value: 'neutral', label: t.voices.genderNeutral },
                ]}
              />
            </div>
          </div>
        </FadeIn>

        {/* Voice Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full h-48 aether-glass-wrapper rounded-[24px]">
              <div className="aether-glass h-full flex flex-col items-center justify-center border-dashed border-white/10">
                <div className="w-6 h-6 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-[#D4D4D8]">{t.voices.syncingModel}</p>
              </div>
            </div>
          ) : voices.length === 0 ? (
            <div className="col-span-full h-64 aether-glass-wrapper rounded-[24px]">
              <div className="aether-glass h-full flex flex-col items-center justify-center border-dashed border-white/10 text-center px-4">
                <svg className="w-10 h-10 text-[#A1A1AA] mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <h2 className="text-sm uppercase tracking-widest text-[#F4F4F5] mb-2">{t.voices.noVoices}</h2>
                <p className="text-xs font-light text-[#A1A1AA] max-w-sm">
                  {t.voices.noModelFound}
                </p>
              </div>
            </div>
          ) : (
            voices.map((voice, idx) => (
              <motion.div
                key={voice.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 * idx }}
                className={`aether-glass-wrapper h-full rounded-[24px] transition-all duration-300 hover:-translate-y-1 ${selectedVoice === voice.id ? 'ring-1 ring-[#6366F1]/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : ''}`}
              >
                  <div className="aether-glass p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-[#F4F4F5] mb-1 inline-flex items-center gap-2">
                          {voice.name}
                          {voice.is_premium && !isPro && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                              PRO
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {voice.is_custom && (
                          <span className="bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                            {t.voices.customBadge}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5" title={voice.is_active ? t.voices.statusOnline : t.voices.statusOffline}>
                          <span className={`w-2 h-2 rounded-full ${voice.is_active ? 'bg-[#6366F1] shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-red-500/50'}`}></span>
                          <span className="text-[9px] uppercase tracking-widest text-[#A1A1AA]">{voice.is_active ? t.voices.statusOnline : t.voices.statusOffline}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#A1A1AA]">{t.voices.metaLanguage}</span>
                        <span className="text-xs font-light text-[#F4F4F5]">{voice.language === 'vi' ? t.voices.langVi : voice.language === 'en' ? t.voices.langEn : voice.language}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#A1A1AA]">{t.voices.metaGender}</span>
                        <span className="text-xs font-light text-[#F4F4F5]">{voice.gender === 'male' ? t.voices.genderMale : voice.gender === 'female' ? t.voices.genderFemale : t.voices.genderNeutral}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#A1A1AA]">{t.voices.modelStatus}</span>
                        <span className={`text-xs font-light ${voice.model_url ? 'text-[#F4F4F5]' : 'text-red-400'}`}>
                          {voice.model_url ? t.voices.statusLinked : t.voices.statusEmpty}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <button
                        onClick={() => previewVoice(voice)}
                        disabled={selectedVoice === voice.id || !voice.is_active || !voice.sample_url}
                        className={`w-full py-2.5 rounded-[8px] border text-[10px] font-medium uppercase tracking-widest transition-all ${
                          selectedVoice === voice.id
                            ? "bg-[#6366F1]/20 border-[#6366F1]/50 text-[#6366F1]"
                            : !voice.is_active
                              ? "bg-white/5 border-white/10 text-[#A1A1AA] cursor-not-allowed"
                              : "bg-white/5 border-white/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#6366F1] hover:to-[#C968F7] hover:text-white hover:border-transparent hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        }`}
                      >
                        {selectedVoice === voice.id ? t.voices.playing : !voice.sample_url ? t.voices.noSample : t.voices.listen}
                      </button>
                    </div>
                  </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
}
