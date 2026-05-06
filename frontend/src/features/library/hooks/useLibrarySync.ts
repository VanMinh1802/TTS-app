'use client';
import { useState, useCallback } from 'react';
import { SyncProgress, LibraryRecord } from '../types';
import { getRecordsFromDB, updateRecordStatus, getCurrentUserId } from '../lib/indexed-db';
import { syncRecordsToCloud } from '../api/library-api';

interface UseLibrarySyncReturn {
  syncProgress: SyncProgress | null;
  startSync: (records: LibraryRecord[]) => Promise<void>;
  isSyncing: boolean;
}

export function useLibrarySync(): UseLibrarySyncReturn {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const startSync = useCallback(async (records: LibraryRecord[], preferFormat?: 'mp3' | 'wav') => {
    const localOnly = records.filter(r => r.sync_status.local && !r.sync_status.cloud);
    if (localOnly.length === 0) return;

    setIsSyncing(true);
    setSyncProgress({ total: localOnly.length, completed: 0, failed: 0, inProgress: true });

    const userId = getCurrentUserId();
    const localRecords = await getRecordsFromDB(userId);
    const syncItems = localOnly.map((rec) => {
      const localRec = localRecords.find((r: LibraryRecord) => r.id === rec.id);
      const wantWav = preferFormat === 'wav';
      const hasMp3 = !!localRec?.audio_mp3;
      const primaryAudio = wantWav
        ? (localRec?.audio_url || '')
        : (hasMp3 ? (localRec?.audio_mp3 || '') : (localRec?.audio_url || ''));
      const base64Data = primaryAudio.split(',')[1] || '';
      return {
        id: rec.id,
        text_content: rec.text_content,
        voice_id: rec.voice_id,
        audio_data: localRec?.audio_url || '',
        audio_mp3: wantWav ? '' : (localRec?.audio_mp3 || ''),
        file_size_bytes: rec.file_size_bytes || Math.round(base64Data.length * 0.75),
        duration: rec.duration ?? null,
      };
    });

    const validItems = syncItems.filter(i => i.audio_data.startsWith('data:'));

    if (validItems.length === 0) {
      setIsSyncing(false);
      setSyncProgress(null);
      return;
    }

    try {
      const result = await syncRecordsToCloud(validItems);
      const completed = result.synced.length;
      const failed = result.failed.length;

      for (const item of result.synced) {
        await updateRecordStatus(item.id, { local: true, cloud: true });
      }
      for (const item of result.failed) {
        console.error(`Sync failed for ${item.id}: ${item.error}`);
      }

      setSyncProgress({ total: validItems.length, completed, failed, inProgress: false });
    } catch (e) {
      console.error('Sync error:', e);
      setSyncProgress({ total: validItems.length, completed: 0, failed: validItems.length, inProgress: false });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { syncProgress, startSync, isSyncing };
}
