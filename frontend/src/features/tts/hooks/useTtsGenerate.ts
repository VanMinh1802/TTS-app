'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { TTSGenerateRequest, TTSGenerateResponse } from '@/features/voice/types/voice-types';

export type StreamingStatus = 'idle' | 'streaming' | 'saving' | 'saved' | 'save-failed';

interface UseTtsGenerateReturn {
  clientGenerate: (request: TTSGenerateRequest) => Promise<TTSGenerateResponse>;
  progress: number;
  isUsingWorker: boolean;
  generating: boolean;
  prefetchModel: (voiceId: string) => void;
  cancelGeneration: () => void;
  streamingStatus: StreamingStatus;
  streamingProgress: { current: number; total: number } | null;
  isPreviewPlaying: boolean;
  togglePreviewPlayback: () => void;
}

/**
 * Converts WAV data URL to MP3 using server-side endpoint.
 * Note: This sends audio data to server, not text content.
 * Only used for non-streaming (short text) mode.
 */
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

/**
 * Parse WAV duration from raw ArrayBuffer by reading the WAV header.
 */
function parseWavDuration(rawBuffer: ArrayBuffer): number {
  try {
    const dataView = new DataView(rawBuffer);
    const sampleRate = dataView.getUint32(24, true);
    const channels = dataView.getUint16(22, true);
    const bitsPerSample = dataView.getUint16(34, true);
    if (!sampleRate || !channels || !bitsPerSample) return 0;

    let offset = 12;
    while (offset + 8 <= rawBuffer.byteLength) {
      const chunkId = String.fromCharCode(
        dataView.getUint8(offset), dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2), dataView.getUint8(offset + 3)
      );
      const chunkSize = dataView.getUint32(offset + 4, true);
      if (chunkId === 'data') {
        return Math.round((chunkSize / (sampleRate * channels * (bitsPerSample / 8))) * 10) / 10;
      }
      offset += 8 + chunkSize;
    }
  } catch { /* ignore */ }
  return 0;
}

/**
 * Hook for local client-side TTS generation using Web Workers and Piper ONNX.
 * Privacy-hardened: Never falls back to server-side synthesis.
 * Supports streaming audio playback for long text (> 1000 chars).
 */
export function useTtsGenerate(): UseTtsGenerateReturn {
  const [progress, setProgress] = useState(0);
  const [isUsingWorker, setIsUsingWorker] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>('idle');
  const [streamingProgress, setStreamingProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Streaming playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunkQueueRef = useRef<ArrayBuffer[]>([]);
  const scheduledEndTimeRef = useRef<number>(0);
  const playbackStartedRef = useRef<boolean>(false);
  const allChunksReceivedRef = useRef<boolean>(false);
  
  // To synchronize playback completion with hook resolution
  const totalChunksRef = useRef<number>(0);
  const chunksPlayedRef = useRef<number>(0);
  const isPreviewPlayingRef = useRef<boolean>(true);

  const togglePreviewPlayback = useCallback(async () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'running') {
      await audioContextRef.current.suspend();
      setIsPreviewPlaying(false);
      isPreviewPlayingRef.current = false;
    } else if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      setIsPreviewPlaying(true);
      isPreviewPlayingRef.current = true;
    }
  }, []);

  const cleanupStreaming = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    chunkQueueRef.current = [];
    scheduledEndTimeRef.current = 0;
    playbackStartedRef.current = false;
    allChunksReceivedRef.current = false;
    totalChunksRef.current = 0;
    chunksPlayedRef.current = 0;
    isPreviewPlayingRef.current = true;
    setStreamingStatus('idle');
    setStreamingProgress(null);
    setIsPreviewPlaying(true);
  }, []);

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
      cleanupStreaming();
    };
  }, [cleanupStreaming]);

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
    cleanupStreaming();
    setProgress(0);
    setGenerating(false);
    setIsUsingWorker(false);
  }, [cleanupStreaming]);

  /**
   * Schedule a WAV chunk for gapless playback using AudioContext.
   * Uses sample-accurate scheduling to ensure zero gaps between chunks.
   */
  const scheduleChunk = useCallback(async (wavBuffer: ArrayBuffer) => {
    let audioCtx = audioContextRef.current;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      scheduledEndTimeRef.current = audioCtx.currentTime;
    }

    // Resume if suspended and we want to play, or suspend if we want to pause
    if (audioCtx.state === 'suspended' && isPreviewPlayingRef.current) {
      await audioCtx.resume();
    } else if (audioCtx.state === 'running' && !isPreviewPlayingRef.current) {
      await audioCtx.suspend();
    }

    // .slice(0) to avoid "detached ArrayBuffer" errors
    const audioBuffer = await audioCtx.decodeAudioData(wavBuffer.slice(0));
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    // Schedule at exact end of previous chunk — zero gap
    const startTime = Math.max(audioCtx.currentTime, scheduledEndTimeRef.current);
    source.start(startTime);
    scheduledEndTimeRef.current = startTime + audioBuffer.duration;

    // Dynamic buffering: when this chunk ends, play next from queue if available
    source.onended = () => {
      chunksPlayedRef.current += 1;
      
      if (chunksPlayedRef.current < totalChunksRef.current) {
        setStreamingProgress({ current: chunksPlayedRef.current + 1, total: totalChunksRef.current });
      }
      
      if (chunkQueueRef.current.length > 0) {
        const nextChunk = chunkQueueRef.current.shift()!;
        scheduleChunk(nextChunk);
      } else if (allChunksReceivedRef.current && chunksPlayedRef.current >= totalChunksRef.current) {
        // If queue empty and all chunks received AND played: playback is fully complete
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        setStreamingStatus('saved');
      }
    };
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
    cleanupStreaming();

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    
    try {
      const worker = getWorker();
      if (!worker) {
        throw new Error('Speech synthesis is not supported in this browser environment');
      }

      return new Promise((resolve, reject) => {
        const done = () => { 
          setIsUsingWorker(false); 
          setGenerating(false); 
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        };

        const resetTimeout = () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            if (worker.onmessage) {
              console.error('[TTS] Worker timeout (5m inactivity)');
              worker.onmessage = null;
              worker.onerror = null;
              cleanupStreaming();
              done();
              reject(new Error('Speech synthesis timed out. Please try a shorter text or check your connection.'));
            }
          }, 300000);
        };

        // A single chunk is ~800 characters (approx 1 minute of audio).
        // Buffering 1 chunk is more than enough to ensure gapless playback.
        const BUFFER_CHUNKS = 1;

        worker.onmessage = (event: MessageEvent) => {
          const { type } = event.data;

          if (type === 'progress') {
            setProgress(event.data.value);
            resetTimeout();

          } else if (type === 'stream-chunk') {
            // === STREAMING: received one chunk's WAV audio ===
            const { buffer, index, total } = event.data;
            totalChunksRef.current = total;
            setStreamingStatus('streaming');
            resetTimeout();

            if (!playbackStartedRef.current) {
              // Buffer phase: collect chunks until we have enough to start
              chunkQueueRef.current.push(buffer);
              if (chunkQueueRef.current.length >= BUFFER_CHUNKS) {
                playbackStartedRef.current = true;
                setStreamingProgress({ current: 1, total: totalChunksRef.current });
                // Schedule all buffered chunks for gapless playback
                while (chunkQueueRef.current.length > 0) {
                  const chunk = chunkQueueRef.current.shift()!;
                  scheduleChunk(chunk);
                }
              } else {
                setStreamingProgress({ current: 0, total: totalChunksRef.current });
              }
            } else {
              // Playback already started — schedule immediately
              scheduleChunk(buffer);
            }

          } else if (type === 'stream-complete') {
            // === STREAMING COMPLETE: received full concatenated WAV ===
            if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }

            allChunksReceivedRef.current = true;
            const fullBuffer = event.data.buffer as ArrayBuffer;

            // If playback hasn't started (e.g., only 1 chunk), flush queue now
            if (!playbackStartedRef.current && chunkQueueRef.current.length > 0) {
              playbackStartedRef.current = true;
              setStreamingProgress({ current: 1, total: totalChunksRef.current });
              while (chunkQueueRef.current.length > 0) {
                const chunk = chunkQueueRef.current.shift()!;
                scheduleChunk(chunk);
              }
            }

            // Save to library (full client-side WAV, NO server MP3 conversion)
            setStreamingStatus('saving');

            const wavDuration = parseWavDuration(fullBuffer);
            const blob = new Blob([fullBuffer], { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = () => {
              const wavDataUrl = reader.result as string;

              // 1. Generation is completely done on the backend.
              // Resolve immediately so the main UI can transition to the static audio player.
              done();
              resolve({
                audio_url: wavDataUrl,
                duration: wavDuration,
                voice_id: request.voice_id,
                audio_wav: wavDataUrl,
              });

              // 2. Manage the live preview playback state.
              if (chunksPlayedRef.current >= totalChunksRef.current) {
                // Playback already finished while we were saving. Close it down.
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                  audioContextRef.current.close().catch(() => {});
                }
                setStreamingStatus('saved');
              } else {
                // Playback is still ongoing! 
                // Revert status to 'streaming' so the Preview UI stays visible while playing.
                // The onended callback will handle closing it when done.
                setStreamingStatus('streaming');
              }
            };
            reader.onerror = () => {
              setStreamingStatus('save-failed');
              done();
              reject(new Error('Failed to process audio for library'));
            };
            reader.readAsDataURL(blob);

            // Record quota usage locally
            apiRequest('/quota/record', {
              method: 'POST',
              body: JSON.stringify({ characters: request.text.length, api_calls: 1 }),
              allowEmpty: true,
            }).catch(() => {});

          } else if (type === 'audio') {
            // === NON-STREAMING: received full audio (short text) ===
            if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
            
            const rawBuffer = event.data.buffer as ArrayBuffer;
            const wavDuration = parseWavDuration(rawBuffer);

            const blob = new Blob([rawBuffer], { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = () => {
              const wavUrl = reader.result as string;
              resolveWithMp3(resolve, wavUrl, wavDuration, request.voice_id).finally(done);
            };
            reader.readAsDataURL(blob);

            // Record quota usage locally
            apiRequest('/quota/record', {
              method: 'POST',
              body: JSON.stringify({ characters: request.text.length, api_calls: 1 }),
              allowEmpty: true,
            }).catch(() => {});

          } else if (type === 'error') {
            if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
            console.error('[TTS] Worker error:', event.data.message);
            cleanupStreaming();
            done();
            reject(new Error(event.data.message || 'Speech synthesis failed'));
          }
        };

        worker.onerror = (e) => {
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          console.error('[TTS] Worker crashed:', e);
          cleanupStreaming();
          done();
          reject(new Error('Speech synthesis engine crashed'));
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

        // 5 minute timeout for local generation
        resetTimeout();
      });
    } catch (err) {
      setIsUsingWorker(false);
      setGenerating(false);
      cleanupStreaming();
      throw err;
    }
  }, [getWorker, resolveWithMp3, scheduleChunk, cleanupStreaming]);

  return {
    clientGenerate, progress, isUsingWorker, generating,
    prefetchModel, cancelGeneration,
    streamingStatus, streamingProgress,
    isPreviewPlaying, togglePreviewPlayback,
  };
}
