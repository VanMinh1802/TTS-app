import { apiRequest } from '@/lib/api-client';

interface CloudRecord {
  id: string;
  user_id: string;
  voice_id: string;
  text_content: string;
  file_url: string;
  file_size_bytes: number;
  duration: number | null;
  created_at: string;
}

interface SyncResponse {
  synced: Array<{ id: string; file_url: string; synced_at: string }>;
  failed: Array<{ id: string; error: string }>;
}

interface SyncRecordInput {
  id: string;
  text_content: string;
  voice_id: string;
  audio_data: string;
  file_size_bytes: number;
  duration: number | null;
}

export async function fetchCloudRecords(): Promise<CloudRecord[]> {
  const res = await apiRequest<{ items: CloudRecord[] }>('/library');
  return res.items;
}

export async function syncRecordsToCloud(records: SyncRecordInput[]): Promise<SyncResponse> {
  return apiRequest<SyncResponse>('/library/sync', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

export async function deleteCloudRecord(recordId: string): Promise<void> {
  await apiRequest<void>(`/library/${recordId}`, {
    method: 'DELETE',
    allowEmpty: true,
  });
}


