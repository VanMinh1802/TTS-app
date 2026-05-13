import { renderHook, act } from '@testing-library/react';
import { useTtsGenerate } from '../useTtsGenerate';
import { generateTts } from '@/features/voice/api/voice-api';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API client and voice API
vi.mock('@/features/voice/api/voice-api', () => ({
  generateTts: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiRequest: vi.fn(),
}));

describe('useTtsGenerate privacy hardening', () => {
  let mockWorker: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockWorker = null;

    global.Worker = class {
      onmessage = null;
      onerror = null;
      postMessage = vi.fn();
      terminate = vi.fn();
      constructor() {
        mockWorker = this;
      }
    } as any;
    
    // Mock generateTts to return a dummy response
    (generateTts as any).mockResolvedValue({
      audio_url: 'http://server-fallback.wav',
      duration: 10
    });
  });

  it('TC-Privacy-01: should NOT fallback to server when worker emits an error', async () => {
    const { result } = renderHook(() => useTtsGenerate());
    
    const request = { text: 'Private sensitive text', voice_id: 'voice-1' };
    
    // Call the function
    let caughtError: any;
    const promise = result.current.clientGenerate(request as any).catch(e => {
        caughtError = e;
    });

    // Wait for worker to be created and handlers set
    await vi.waitFor(() => {
        if (!mockWorker || !mockWorker.onmessage) throw new Error('Worker/onmessage not ready');
    });

    // Simulate worker sending an error
    await act(async () => {
      mockWorker.onmessage({ data: { type: 'error', message: 'Model load failed' } });
    });

    await promise;

    // After hardening, generateTts should NOT have been called
    expect(generateTts).not.toHaveBeenCalled();
    expect(caughtError?.message || '').toContain('Model load failed');
  });

  it('TC-Privacy-02: should NOT fallback to server when worker crashes', async () => {
    const { result } = renderHook(() => useTtsGenerate());
    
    const request = { text: 'Private sensitive text', voice_id: 'voice-1' };
    
    let caughtError: any;
    const promise = result.current.clientGenerate(request as any).catch(e => {
      caughtError = e;
    });

    // Wait for worker to be created and handlers set
    await vi.waitFor(() => {
        if (!mockWorker || !mockWorker.onerror) throw new Error('Worker/onerror not ready');
    });

    // Simulate worker crash inside act to capture all state updates
    await act(async () => {
      mockWorker.onerror(new ErrorEvent('error', { message: 'Worker crashed' }));
      await promise;
    });

    expect(caughtError).toBeTruthy();
    expect(generateTts).not.toHaveBeenCalled();
  });
});
