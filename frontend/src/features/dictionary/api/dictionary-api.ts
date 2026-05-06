import { apiRequest } from "@/lib/api-client";

export interface DictionaryEntry {
  id?: string;
  word: string;
  pronunciation: string;
}

interface ApiDictionaryEntry {
  id: string;
  word: string;
  pronunciation?: string;
  reading?: string;
}

const mapApiToEntry = (data: ApiDictionaryEntry): DictionaryEntry => ({
  id: data.id,
  word: data.word,
  pronunciation: data.pronunciation || data.reading || data.word,
});

export async function getDictionaryEntries(): Promise<DictionaryEntry[]> {
  try {
    const data = await apiRequest<{ entries: ApiDictionaryEntry[] }>("/dictionary");
    return data.entries.map(mapApiToEntry);
  } catch {
    return [];
  }
}

export async function createDictionaryEntry(entry: { word: string; reading?: string; pronunciation?: string }): Promise<DictionaryEntry> {
  const data = await apiRequest<ApiDictionaryEntry>("/dictionary", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  return mapApiToEntry(data);
}

export async function deleteDictionaryEntry(id: string): Promise<void> {
  await apiRequest(`/dictionary/${id}`, {
    method: "DELETE",
    allowEmpty: true,
  });
}

export async function updateDictionaryEntry(id: string, data: { word?: string; reading?: string; pronunciation?: string }): Promise<DictionaryEntry> {
  const result = await apiRequest<ApiDictionaryEntry>(`/dictionary/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return mapApiToEntry(result);
}