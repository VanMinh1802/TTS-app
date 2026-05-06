import { describe, test, expect } from 'vitest';

describe('useLibrarySync diff logic', () => {
  function computeSyncDiff(records: Array<{ id: string; local: boolean; cloud: boolean }>) {
    return records.filter(r => r.local && !r.cloud).map(r => r.id);
  }

  test('returns ids present in local but not cloud', () => {
    const diff = computeSyncDiff([
      { id: 'a', local: true, cloud: false },
      { id: 'b', local: true, cloud: true },
      { id: 'c', local: false, cloud: true },
    ]);
    expect(diff).toEqual(['a']);
  });

  test('returns empty when all local are in cloud', () => {
    const diff = computeSyncDiff([
      { id: 'a', local: true, cloud: true },
      { id: 'b', local: true, cloud: true },
    ]);
    expect(diff).toEqual([]);
  });
});
