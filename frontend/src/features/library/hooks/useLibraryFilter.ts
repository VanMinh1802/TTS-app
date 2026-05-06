'use client';
import { useState, useMemo } from 'react';
import { LibraryRecord, LibraryTab, FilterState } from '../types';

export function useLibraryFilter(records: LibraryRecord[]) {
  const [filter, setFilter] = useState<FilterState>({
    tab: 'all',
    search: '',
    voiceFilter: null,
    sortBy: 'newest',
  });

  const availableVoices = useMemo(() => {
    const voices = new Set(records.map(r => r.voice_id));
    return Array.from(voices).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = [...records];

    switch (filter.tab) {
      case 'local':
        result = result.filter(r => r.sync_status.local && !r.sync_status.cloud);
        break;
      case 'cloud':
        result = result.filter(r => !r.sync_status.local && r.sync_status.cloud);
        break;
      case 'synced':
        result = result.filter(r => r.sync_status.local && r.sync_status.cloud);
        break;
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(r => r.text_content.toLowerCase().includes(q));
    }

    if (filter.voiceFilter) {
      result = result.filter(r => r.voice_id === filter.voiceFilter);
    }

    switch (filter.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.text_content.localeCompare(b.text_content));
        break;
    }

    return result;
  }, [records, filter]);

  const tabCounts = useMemo(() => ({
    all: records.length,
    local: records.filter(r => r.sync_status.local && !r.sync_status.cloud).length,
    cloud: records.filter(r => !r.sync_status.local && r.sync_status.cloud).length,
    synced: records.filter(r => r.sync_status.local && r.sync_status.cloud).length,
  }), [records]);

  return { filter, setFilter: (update: Partial<FilterState>) => setFilter(p => ({ ...p, ...update })), filteredRecords, availableVoices, tabCounts };
}
