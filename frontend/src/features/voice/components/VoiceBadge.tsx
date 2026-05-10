'use client';

import type { VoiceInfo } from '@/features/voice/hooks/useVoiceMap';

interface VoiceBadgeProps {
  voiceId: string;
  getVoice?: (id: string) => VoiceInfo;
  className?: string;
}

export function VoiceBadge({ voiceId, getVoice, className = '' }: VoiceBadgeProps) {
  const info = getVoice?.(voiceId);
  const name = info?.name ?? voiceId;
  const isPremium = info?.isPremium ?? false;

  return (
    <span className={`aether-badge inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] px-3 py-1 ${
      isPremium
        ? '!text-amber-400 !bg-amber-500/10 !border-amber-500/30'
        : ''
    } ${className}`}>
      {name}
      {isPremium && (
        <span className="text-[7px] font-bold uppercase text-amber-500 ml-0.5 px-1 py-px rounded border border-amber-500/30 bg-amber-500/10">
          PRO
        </span>
      )}
    </span>
  );
}
