export interface SyncStatus {
  local: boolean;
  cloud: boolean;
}

export interface LibraryRecord {
  id: string;
  text_content: string;
  voice_id: string;
  audio_url: string;
  audio_mp3?: string;
  audio_wav?: string;
  file_size_bytes: number;
  duration: number | null;
  created_at: string;
  sync_status: SyncStatus;
  user_id?: string;
}

export type LibraryViewMode = 'grid' | 'list';

export type LibraryTab = 'all' | 'local' | 'cloud' | 'synced';

export interface FilterState {
  tab: LibraryTab;
  search: string;
  voiceFilter: string | null;
  sortBy: 'newest' | 'oldest' | 'az';
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

/**
 * Extract duration (seconds) from a base64-encoded WAV data URL.
 * Returns null if parsing fails (e.g. not a WAV or no audio_url).
 */
export function getRecordDuration(record: LibraryRecord): number | null {
  if (record.duration != null) return record.duration;
  if (!record.audio_url) return null;

  try {
    const parts = record.audio_url.split(',');
    if (parts.length < 2) return null;
    const base64 = parts[1];
    if (!base64) return null;

    const binaryStr = atob(base64.slice(0, 256));
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    if (bytes.length < 44) return null;
    const dv = new DataView(bytes.buffer);

    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (riff !== 'RIFF') return null;

    const channels = dv.getUint16(22, true);
    const sampleRate = dv.getUint32(24, true);
    const bitsPerSample = dv.getUint16(34, true);
    if (!sampleRate || !channels || !bitsPerSample) return null;

    let dataSize = 0;
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
      const chunkSize = dv.getUint32(offset + 4, true);
      if (chunkId === 'data') { dataSize = chunkSize; break; }
      offset += 8 + chunkSize;
    }

    if (!dataSize) return null;
    const bytesPerSec = sampleRate * channels * (bitsPerSample / 8);
    return Math.round((dataSize / bytesPerSec) * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Compute the badge status string for a library record based on its sync state.
 */
export function computeStatusBadge(syncStatus: SyncStatus): "synced" | "local" | "cloud" {
  if (syncStatus.local && syncStatus.cloud) return "synced";
  if (syncStatus.local) return "local";
  return "cloud";
}
