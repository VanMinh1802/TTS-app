import { describe, test, expect } from 'vitest';
import { LibraryRecord } from '../types';

describe('useLibraryRecords merge logic', () => {
  function mergeRecords(localRecords: any[], cloudRecords: any[]): LibraryRecord[] {
    const localMap = new Map(localRecords.map((r: any) => [r.id, r]));
    const cloudMap = new Map(cloudRecords.map(r => [r.id, r]));
    const mergedIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
    const merged: LibraryRecord[] = [];
    for (const id of mergedIds) {
      const local = localMap.get(id);
      const cloud = cloudMap.get(id);
      merged.push({
        id,
        text_content: cloud?.text_content ?? local?.text_content ?? '',
        voice_id: cloud?.voice_id ?? local?.voice_id ?? '',
        audio_url: local?.audio_url ?? cloud?.file_url ?? '',
        file_size_bytes: cloud?.file_size_bytes ?? local?.file_size_bytes ?? 0,
        duration: local?.duration ?? cloud?.duration ?? null,
        created_at: local?.created_at ?? cloud?.created_at ?? '',
        sync_status: { local: !!local, cloud: !!cloud },
      });
    }
    return merged;
  }

  test('merges local-only records with sync_status local=true cloud=false', () => {
    const result = mergeRecords(
      [{ id: '1', text_content: 'hello', audio_url: 'data:...' }],
      []
    );
    expect(result[0].sync_status).toEqual({ local: true, cloud: false });
    expect(result[0].audio_url).toBe('data:...');
  });

  test('merges cloud-only records with sync_status local=false cloud=true', () => {
    const result = mergeRecords(
      [],
      [{ id: '1', text_content: 'hello', file_url: 'https://r2.example.com/1.wav' }]
    );
    expect(result[0].sync_status).toEqual({ local: false, cloud: true });
  });

  test('merges synced records with sync_status local=true cloud=true', () => {
    const result = mergeRecords(
      [{ id: '1', text_content: 'hello', audio_url: 'data:...' }],
      [{ id: '1', text_content: 'hello', file_url: 'https://r2.example.com/1.wav' }]
    );
    expect(result[0].sync_status).toEqual({ local: true, cloud: true });
  });
});
