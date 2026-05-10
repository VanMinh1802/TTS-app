'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateTts } from '@/features/voice/api/voice-api';
import { apiRequest } from '@/lib/api-client';
import type { TTSGenerateRequest, TTSGenerateResponse } from '@/features/voice/types/voice-types';

interface UseTtsGenerateReturn {
  clientGenerate: (request: TTSGenerateRequest) => Promise<TTSGenerateResponse>;
  progress: number;
  isUsingWorker: boolean;
  generating: boolean;
  prefetchModel: (voiceId: string) => void;
  cancelGeneration: () => void;
}

async function convertToMp3(wavDataUrl: string): Promise<string | null> {
  try {
    const resp = await apiRequest<{ mp3_url?: string }>('/tts/convert-to-mp3', {
      method: 'POST',
      body: JSON.stringify({ audio_data: wavDataUrl }),
    });
    return resp.mp3_url || null;
  } catch {
    return null;
  }
}

export function useTtsGenerate(): UseTtsGenerateReturn {
  const [progress, setProgress] = useState(0);
  const [isUsingWorker, setIsUsingWorker] = useState(false);
  const [generating, setGenerating] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'cancel' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const getWorker = useCallback(() => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      workerRef.current = new Worker(new URL('../../../workers/tts-worker.ts', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  }, []);

  const prefetchModel = useCallback((voiceId: string) => {
    const worker = getWorker();
    if (worker) {
      worker.postMessage({ type: 'prefetch', data: { voiceId } });
    }
  }, [getWorker]);

  const cancelGeneration = useCallback(() => {
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage({ type: 'cancel' });
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setProgress(0);
    setGenerating(false);
    setIsUsingWorker(false);
  }, []);

  const resolveWithMp3 = useCallback(async (
    resolve: (value: TTSGenerateResponse) => void,
    wavDataUrl: string,
    duration: number,
    voiceId: string,
  ) => {
    const mp3Url = await convertToMp3(wavDataUrl);
    resolve({
      audio_url: mp3Url || wavDataUrl,
      duration,
      voice_id: voiceId,
      audio_mp3: mp3Url || undefined,
      audio_wav: wavDataUrl,
    });
  }, []);

  const clientGenerate = useCallback(async (request: TTSGenerateRequest): Promise<TTSGenerateResponse> => {
    setProgress(0);
    setIsUsingWorker(true);
    setGenerating(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const worker = getWorker();
      if (!worker) {
        setIsUsingWorker(false);
        const serverResponse = await generateTts(request, signal);
        return new Promise<TTSGenerateResponse>((resolve) => {
          resolveWithMp3(resolve, serverResponse.audio_url, serverResponse.duration, request.voice_id);
        });
      }

      return new Promise((resolve, reject) => {
        const done = () => { setIsUsingWorker(false); setGenerating(false); };

        worker.onmessage = (event: MessageEvent) => {
          const { type } = event.data;

          if (type === 'cache-status') {
          } else if (type === 'progress') {
            setProgress(event.data.value);
          } else if (type === 'audio') {
            if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
            const rawBuffer = event.data.buffer as ArrayBuffer;
            const dataView = new DataView(rawBuffer);
            const sampleRate = dataView.getUint32(24, true);
            const channels = dataView.getUint16(22, true);
            const bitsPerSample = dataView.getUint16(34, true);
            let wavDuration = 0;
            if (sampleRate && channels && bitsPerSample) {
              let offset = 12;
              while (offset + 8 <= rawBuffer.byteLength) {
                const chunkId = String.fromCharCode(
                  dataView.getUint8(offset), dataView.getUint8(offset + 1),
                  dataView.getUint8(offset + 2), dataView.getUint8(offset + 3)
                );
                const chunkSize = dataView.getUint32(offset + 4, true);
                if (chunkId === 'data') {
                  wavDuration = Math.round((chunkSize / (sampleRate * channels * (bitsPerSample / 8))) * 10) / 10;
                  break;
                }
                offset += 8 + chunkSize;
              }
            }

            const blob = new Blob([rawBuffer], { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = () => {
              const wavUrl = reader.result as string;
              resolveWithMp3(resolve, wavUrl, wavDuration, request.voice_id).finally(done);
            };
            reader.readAsDataURL(blob);

            apiRequest('/quota/record', {
              method: 'POST',
              body: JSON.stringify({ characters: request.text.length, api_calls: 1 }),
              allowEmpty: true,
            }).catch(() => {});
          } else if (type === 'error') {
            if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
            console.warn('[TTS] Worker error, falling back to server:', event.data.message);
            setIsUsingWorker(false);
            generateTts(request, signal).then((resp) => {
              resolveWithMp3(resolve, resp.audio_url, resp.duration, request.voice_id).finally(done);
            }).catch(reject);
          }
        };

        worker.onerror = () => {
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          console.warn('[TTS] Worker crashed, falling back to server');
          setIsUsingWorker(false);
          generateTts(request, signal).then((resp) => {
            resolveWithMp3(resolve, resp.audio_url, resp.duration, request.voice_id).finally(done);
          }).catch(reject);
        };

        worker.postMessage({
          type: 'generate',
          data: {
            voiceId: request.voice_id,
            text: request.text,
            speed: request.speed,
            dictionary: request.user_dictionary || [],
            modelKey: request.model_key,
          }
        });

        timeoutRef.current = setTimeout(() => {
          if (worker.onmessage) {
            console.warn('[TTS] Worker timeout (30s), falling back to server');
            worker.onmessage = null;
            worker.onerror = null;
            setIsUsingWorker(false);
            generateTts(request, signal).then((resp) => {
              resolveWithMp3(resolve, resp.audio_url, resp.duration, request.voice_id).finally(done);
            }).catch(reject);
          }
        }, 30000);
      });
    } catch {
      setIsUsingWorker(false);
      setGenerating(false);
      const serverResponse = await generateTts(request, signal);
      return new Promise<TTSGenerateResponse>((resolve) => {
        resolveWithMp3(resolve, serverResponse.audio_url, serverResponse.duration, request.voice_id);
      });
    }
  }, [getWorker, resolveWithMp3]);

  return { clientGenerate, progress, isUsingWorker, generating, prefetchModel, cancelGeneration };
}
