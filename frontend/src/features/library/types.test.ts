import { SyncStatus, LibraryRecord, LibraryViewMode, FilterState, computeStatusBadge, getRecordDuration } from './types';

describe('Library types', () => {
  test('SyncStatus accepts local/cloud/synced', () => {
    const status: SyncStatus = { local: true, cloud: false };
    expect(status.local).toBe(true);
    expect(status.cloud).toBe(false);
  });

  test('LibraryRecord has all required fields', () => {
    const record: LibraryRecord = {
      id: '1',
      text_content: 'hello',
      voice_id: 'v1',
      audio_url: 'data:audio/wav;base64,...',
      file_size_bytes: 100,
      duration: 1.5,
      created_at: '2026-01-01T00:00:00Z',
      sync_status: { local: true, cloud: false },
    };
    expect(record.voice_id).toBe('v1');
  });

  test('computeStatusBadge returns synced when both local and cloud', () => {
    expect(computeStatusBadge({ local: true, cloud: true })).toBe('synced');
  });

  test('computeStatusBadge returns local when only local', () => {
    expect(computeStatusBadge({ local: true, cloud: false })).toBe('local');
  });

  test('computeStatusBadge returns cloud when only cloud', () => {
    expect(computeStatusBadge({ local: false, cloud: true })).toBe('cloud');
  });

  test('getRecordDuration returns stored duration when available', () => {
    expect(getRecordDuration({
      id: '1', text_content: '', voice_id: '', audio_url: '', file_size_bytes: 0,
      duration: 3.5, created_at: '', sync_status: { local: true, cloud: false },
    })).toBe(3.5);
  });

  test('getRecordDuration returns null when no audio_url and no duration', () => {
    expect(getRecordDuration({
      id: '1', text_content: '', voice_id: '', audio_url: '', file_size_bytes: 0,
      duration: null, created_at: '', sync_status: { local: true, cloud: false },
    })).toBeNull();
  });

  test('getRecordDuration returns duration from stored field even when audio_url is empty', () => {
    expect(getRecordDuration({
      id: '1', text_content: '', voice_id: '', audio_url: '', file_size_bytes: 0,
      duration: 2.1, created_at: '', sync_status: { local: true, cloud: false },
    })).toBe(2.1);
  });
});
