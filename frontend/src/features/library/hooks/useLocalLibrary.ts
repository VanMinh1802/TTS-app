import { useState, useCallback, useEffect } from 'react';
import { LibraryRecord } from '../types';
import { getRecordsFromDB, saveRecordToDB, deleteRecordFromDB, getCurrentUserId } from '../lib/indexed-db';

export function useLocalLibrary() {
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      const userId = getCurrentUserId();
      const data = await getRecordsFromDB(userId);
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecords(data);
    } catch (e) {
      console.error('Failed to load local records', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const saveLocalRecord = useCallback(async (record: Omit<LibraryRecord, 'user_id' | 'sync_status'>) => {
    try {
      const userId = getCurrentUserId();
      await saveRecordToDB({ ...record, user_id: userId, sync_status: { local: true, cloud: false } });
      await loadRecords();
    } catch (e) {
      console.error('Failed to save local record', e);
    }
  }, [loadRecords]);

  const deleteLocalRecord = useCallback(async (id: string) => {
    try {
      await deleteRecordFromDB(id);
      await loadRecords();
    } catch (e) {
      console.error('Failed to delete local record', e);
    }
  }, [loadRecords]);

  return { records, loading, saveLocalRecord, deleteLocalRecord, refreshLocalRecords: loadRecords };
}
