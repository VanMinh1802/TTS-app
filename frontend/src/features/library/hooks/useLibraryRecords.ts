'use client';
import { useState, useEffect, useCallback } from 'react';
import { LibraryRecord } from '../types';
import { getRecordsFromDB, getCurrentUserId } from '../lib/indexed-db';
import { fetchCloudRecords } from '../api/library-api';

interface UseLibraryRecordsReturn {
  records: LibraryRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLibraryRecords(isPro: boolean): UseLibraryRecordsReturn {
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = getCurrentUserId();
      const localRecords = await getRecordsFromDB(userId);
      const localMap = new Map(localRecords.map((r: LibraryRecord) => [r.id, r]));

      if (isPro) {
        const cloudRecords = await fetchCloudRecords();
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
            audio_mp3: local?.audio_mp3,
            audio_wav: local?.audio_wav,
            file_size_bytes: cloud?.file_size_bytes ?? local?.file_size_bytes ?? 0,
            duration: local?.duration ?? cloud?.duration ?? null,
            created_at: local?.created_at ?? cloud?.created_at ?? '',
            sync_status: { local: !!local, cloud: !!cloud },
          });
        }

        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecords(merged);
      } else {
        setRecords(localRecords.map((r: LibraryRecord) => ({
          ...r,
          sync_status: { local: true, cloud: false },
        })));
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load library records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  return { records, loading, error, refresh: loadRecords };
}
