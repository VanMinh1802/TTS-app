import { loadCustomPiper, type PiperCustomSession } from '@/lib/piper/piperCustom';
import { encodeWav } from '@/lib/audio/wav';

const R2_PUBLIC_URL = 'https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev';
const PIPER_PHONEMIZE_PATHS = {
  piperWasm: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm',
  piperData: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data',
};

const DB_NAME = 'tts-model-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';

const VOICE_FILE_NAMES: Record<string, string> = {
  anhtai: 'taian4',
  baouyen: 'baouyen_6463',
  namminh: 'namminh_tram',
  vietcuong: 'vietcuong_6994',
  anhkhoi: 'anhkhoi',
  ngocduy: 'duyoryx3175',
  thanhphuong: 'thanhphuong2',
  tranthanh: 'tranthanh3870',
  vietthao: 'vietthao2',
};

function getModelFileName(voiceId: string): string {
  return VOICE_FILE_NAMES[voiceId] ?? voiceId;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// === IndexedDB Model Cache ===
interface ModelCacheEntry {
  voiceId: string;
  modelBuffer: ArrayBuffer;
  configText: string;
  modelKey: string;
  updatedAt: string;
  downloadedAt: number;
  size: number;
}

function openModelDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'voiceId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadModelFromDb(voiceId: string, expectedModelKey?: string, expectedUpdatedAt?: string): Promise<ModelCacheEntry | null> {
  try {
    const db = await openModelDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(voiceId);
      req.onsuccess = () => {
        db.close();
        const entry = req.result as ModelCacheEntry | undefined;
        if (entry?.modelBuffer && entry?.configText) {
          if (expectedModelKey && entry.modelKey !== expectedModelKey) {
            resolve(null);
            return;
          }
          if (expectedUpdatedAt && entry.updatedAt !== expectedUpdatedAt) {
            resolve(null);
            return;
          }
          resolve(entry);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => { db.close(); resolve(null); };
    });
  } catch { return null; }
}

async function saveModelToDb(voiceId: string, modelBuffer: ArrayBuffer, configText: string, modelKey: string, updatedAt: string): Promise<void> {
  try {
    const db = await openModelDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const entry: ModelCacheEntry = {
        voiceId,
        modelBuffer,
        configText,
        modelKey,
        updatedAt,
        downloadedAt: Date.now(),
        size: modelBuffer.byteLength,
      };
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); };
    });
  } catch { /* cache is optional */ }
}

// === Session Cache (in-memory) ===
const sessionCache = new Map<string, Promise<PiperCustomSession>>();
let defaultVoice = '';
let isCancelled = false;

async function ensureSession(voiceId: string, modelName: string, modelKey?: string, updatedAt?: string): Promise<PiperCustomSession> {
  const versionKey = [voiceId, modelKey || '', updatedAt || ''].join('|');
  const cached = sessionCache.get(versionKey);
  if (cached) return cached;

  const effectiveModelName = modelKey
    ? modelKey.split('/').pop()?.replace('.onnx', '') || modelName
    : modelName;

  const promise = (async () => {
    let baseUrl: string;
    if (modelKey) {
      const lastSlash = modelKey.lastIndexOf('/');
      const folder = modelKey.substring(3, lastSlash);
      baseUrl = `${R2_PUBLIC_URL}/vi/${folder}`;
    } else {
      baseUrl = `${R2_PUBLIC_URL}/vi/${voiceId}`;
    }

    const cachedEntry = await loadModelFromDb(voiceId, modelKey, updatedAt);
    if (cachedEntry) {
      self.postMessage({ type: 'progress', value: 15 });
      self.postMessage({ type: 'cache-status', fromCache: true, url: voiceId });
    } else {
      self.postMessage({ type: 'progress', value: 5 });
      self.postMessage({ type: 'cache-status', fromCache: false, url: voiceId });
    }

    const session = await loadCustomPiper(
      baseUrl, effectiveModelName, undefined, PIPER_PHONEMIZE_PATHS,
      cachedEntry?.modelBuffer, cachedEntry?.configText,
    );

    if (!cachedEntry) {
      const modelUrl = `${baseUrl}/${encodeURIComponent(effectiveModelName)}.onnx`;
      const configUrl = `${baseUrl}/${encodeURIComponent(effectiveModelName)}.onnx.json`;
      const cacheKey = modelKey || `vi/${voiceId}/${effectiveModelName}.onnx`;
      Promise.all([
        fetch(modelUrl).then(r => r.arrayBuffer()),
        fetch(configUrl).then(r => r.text()),
      ]).then(([buf, cfg]) => saveModelToDb(voiceId, buf, cfg, cacheKey, updatedAt || '')).catch(() => {});
    }

    return session;
  })();

  sessionCache.set(versionKey, promise);
  return promise;
}

// === Message Handler ===
self.onmessage = async function (event: MessageEvent) {
  const { type, data } = event.data;

  if (type === 'prefetch') {
    const { voiceId } = data;
    if (!voiceId) return;
    defaultVoice = voiceId;
    try {
      await ensureSession(voiceId, getModelFileName(voiceId));
      self.postMessage({ type: 'prefetch-done', voiceId });
    } catch {
    }
    return;
  }

  if (type === 'cancel') {
    isCancelled = true;
    return;
  }

  if (type === 'generate') {
    const { voiceId, text, speed, dictionary, modelKey, updatedAt } = data;
    if (!voiceId) return;
    try {
      const modelName = getModelFileName(voiceId);

      const session = await ensureSession(voiceId, modelName, modelKey, updatedAt);
      self.postMessage({ type: 'progress', value: 50 });

      let processedText = text;
      if (dictionary && dictionary.length > 0) {
        const entries = [...dictionary].sort(
          (a: { word: string; pronunciation: string }, b: { word: string; pronunciation: string }) =>
            b.word.length - a.word.length
        );
        for (const entry of entries) {
          processedText = processedText.replace(new RegExp(escapeRegex(entry.word), 'gi'), entry.pronunciation || entry.word);
        }
      }

      if (isCancelled) return;

      const float32Audio = await session.predict(processedText, {
        lengthScale: (speed && speed > 0) ? speed : 1.0,
        onProgress: (p: number) => {
          self.postMessage({ type: 'progress', value: 50 + Math.round(p * 0.45) });
        },
      });
      self.postMessage({ type: 'progress', value: 95 });
      self.postMessage({ type: 'audio', buffer: encodeWav(float32Audio, session.sampleRate) });
      self.postMessage({ type: 'progress', value: 100 });

    } catch (error) {
      self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Unknown worker error' });
    }
  }
};
