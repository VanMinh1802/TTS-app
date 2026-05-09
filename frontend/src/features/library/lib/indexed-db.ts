import { LibraryRecord } from '../types';

const DB_NAME = 'GenVoiceDB';
const DB_VERSION = 2;
const STORE_NAME = 'audioRecords';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      const store = (e.target as IDBOpenDBRequest).transaction?.objectStore(STORE_NAME);
      if (store && !store.indexNames.contains('user_id')) {
        store.createIndex('user_id', 'user_id', { unique: false });
      }
    };
  });
}

export async function getRecordsFromDB(userId?: string): Promise<LibraryRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result || [];
      if (userId) {
        resolve(all.filter((r: LibraryRecord) => r.user_id === userId));
      } else {
        resolve(all);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecordToDB(record: LibraryRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecordFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

let cachedUserId: string = 'anonymous';

export function setCurrentUserId(id: string) {
  cachedUserId = id || 'anonymous';
}

export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  return cachedUserId;
}

export async function updateRecordStatus(id: string, syncStatus: { local: boolean; cloud: boolean }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.sync_status = syncStatus;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
