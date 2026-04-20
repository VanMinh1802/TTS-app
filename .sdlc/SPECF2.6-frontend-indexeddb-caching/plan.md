# PLAN: F2.6 - IndexedDB Model Caching

## Architecture

```
frontend/src/lib/cache/
├── index.ts          # Public API exports
├── model-cache.ts   # Main cache service class
└── indexeddb.ts   # IndexedDB raw operations
```

## Data Model (IndexedDB)

### Object Stores

| Store Name | Key | Indexes |
|------------|-----|---------|
| `models` | `id` | `lastAccessed` |
| `metadata` | `key` | - |

### Schema

```typescript
interface CachedModel {
  id: string;           // Model identifier
  name: string;        // Model name
  version: string;     // Model version
  blob: ArrayBuffer;  // ONNX model data
  size: number;       // Size in bytes
  cachedAt: number;   // Unix timestamp
  lastAccessed: number;
}

interface CacheMetadata {
  key: string;
  value: number;
}
```

## Implementation

### 1. Raw IndexedDB Layer (`indexeddb.ts`)
- `openDB()`: Open/create database with schema
- `get()`: Get item by key
- `put()`: Store item
- `delete()`: Remove item
- `clear()`: Clear store
- `getAll()`: Get all items

### 2. Cache Service (`model-cache.ts`)
- `isCached(modelId)`: Check if model exists
- `getModel(modelId)`: Get ArrayBuffer
- `cacheModel(modelId, data, metadata)`: Store model
- `getCacheInfo()`: Get size + model list
- `clearCache()`: Clear all models
- `checkVersion(modelId, remoteVersion)`: Compare versions
- `_cleanup()`: Remove oldest if quota exceeded

### 3. Public API (`index.ts`)
- Export `modelCache` singleton instance

## Configuration

```typescript
const CACHE_CONFIG = {
  MAX_SIZE: 500 * 1024 * 1024,  // 500MB
  DB_NAME: 'tts-model-cache',
  DB_VERSION: 1,
};
```

## Dependencies

- [x] F2.5 (TTS Generator UI)

---

# Implementation Steps

- [x] 1. Create `.sdlc/SPECF2.6-frontend-indexeddb-caching/plan.md`
- [x] 2. Create `frontend/src/lib/cache/indexeddb.ts`
- [x] 3. Create `frontend/src/lib/cache/model-cache.ts`
- [x] 4. Create `frontend/src/lib/cache/index.ts`
- [x] 5. Verify with TypeScript ✅