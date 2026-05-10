'use client';

import { useEffect, useState } from "react";
import { getStudioVoices } from "../api/voice-api";
import type { StudioVoice } from "../types/voice-types";

export interface VoiceInfo {
  name: string;
  isPremium: boolean;
  sample_url?: string | null;
}

export function useVoiceMap() {
  const [voiceMap, setVoiceMap] = useState<Map<string, VoiceInfo>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getStudioVoices()
      .then((voices) => {
        if (cancelled) return;
        const map = new Map<string, VoiceInfo>();
        for (const v of voices) {
          map.set(v.id, {
            name: v.name,
            isPremium: v.is_premium ?? false,
            sample_url: v.sample_url,
          });
        }
        setVoiceMap(map);
      })
      .catch(() => {
        if (!cancelled) setVoiceMap(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getVoice = (voiceId: string): VoiceInfo => {
    return (
      voiceMap.get(voiceId) ?? {
        name: voiceId,
        isPremium: false,
      }
    );
  };

  return { voiceMap, getVoice, loading };
}
