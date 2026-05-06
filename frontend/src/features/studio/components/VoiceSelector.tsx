'use client';

import { useT } from "@/shared/i18n";
import { UiSelect } from "@/components/ui/UiSelect";

interface Voice {
  id: string;
  name: string;
  lang: string;
  available: boolean;
  sample_url?: string | null;
}

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
}

export function VoiceSelector({ voices, selectedVoice, onSelect }: VoiceSelectorProps) {
  const t = useT();
  const availableVoices = voices.filter(v => v.available);
  const selected = voices.find(v => v.id === selectedVoice);

  return (
    <div className="aether-glass-wrapper rounded-[24px] transition-all duration-300 group hover:opacity-90">
      <div className="aether-glass rounded-[24px] p-4">
        <label className="block text-[14px] font-medium tracking-wide text-[#A1A1AA] mb-2">{t.studio.voiceSelect}</label>
        <UiSelect
          value={selectedVoice}
          onChange={onSelect}
          options={[
            ...availableVoices.map((voice) => ({ value: voice.id, label: voice.name })),
            ...voices.filter(v => !v.available).map((voice) => ({ value: voice.id, label: `${voice.name} (Sắp ra mắt)`, disabled: true })),
          ]}
          buttonClassName="bg-transparent border-b border-[#333333] text-[#F4F4F5] hover:border-[#6366F1] font-medium text-[15px] pb-3"
        />
        {selected && (
          <div className="flex items-center gap-3 mt-3">
            <p className="text-[12px] font-normal tracking-wide text-[#71717A] opacity-80">{selected.lang}</p>
            {selected.sample_url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const audio = new Audio(selected.sample_url!);
                  audio.play().catch(() => {});
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-widest text-[#A1A1AA] hover:text-white transition-colors"
                title="Nghe thử giọng"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7-11-7z"/></svg>
                Nghe thử
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
