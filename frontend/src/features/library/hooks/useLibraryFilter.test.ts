import { describe, test, expect } from 'vitest';
import { LibraryRecord } from '../types';

function applyFilter(
  records: LibraryRecord[],
  options: { tab: string; search: string; voiceFilter: string | null; sortBy: string }
): LibraryRecord[] {
  let result = [...records];

  switch (options.tab) {
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

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(r => r.text_content.toLowerCase().includes(q));
  }

  if (options.voiceFilter) {
    result = result.filter(r => r.voice_id === options.voiceFilter);
  }

  switch (options.sortBy) {
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
}

const mockRecords: LibraryRecord[] = [
  { id: '1', text_content: 'Xin chào', voice_id: 'v1', audio_url: '', file_size_bytes: 100, duration: 1, created_at: '2026-03-01', sync_status: { local: true, cloud: false } },
  { id: '2', text_content: 'Hello world', voice_id: 'v2', audio_url: '', file_size_bytes: 200, duration: 2, created_at: '2026-02-01', sync_status: { local: true, cloud: true } },
  { id: '3', text_content: 'Test audio', voice_id: 'v1', audio_url: '', file_size_bytes: 300, duration: 3, created_at: '2026-01-01', sync_status: { local: false, cloud: true } },
];

test('filter tab=local returns only local-only records', () => {
  const result = applyFilter(mockRecords, { tab: 'local', search: '', voiceFilter: null, sortBy: 'newest' });
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('1');
});

test('filter search matches text_content', () => {
  const result = applyFilter(mockRecords, { tab: 'all', search: 'hello', voiceFilter: null, sortBy: 'newest' });
  expect(result).toHaveLength(1);
});

test('filter voiceFilter', () => {
  const result = applyFilter(mockRecords, { tab: 'all', search: '', voiceFilter: 'v2', sortBy: 'newest' });
  expect(result).toHaveLength(1);
});

test('sort oldest first', () => {
  const result = applyFilter(mockRecords, { tab: 'all', search: '', voiceFilter: null, sortBy: 'oldest' });
  expect(result[0].id).toBe('3');
});
