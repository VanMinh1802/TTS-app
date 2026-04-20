# PLAN: F2.7 - ONNX Runtime Web Worker

## Architecture

```
frontend/
├── public/
│   └── workers/
│       └── tts-worker.js        # Web Worker
├── src/
│   ├── lib/
│   │   └── tts/
│   │       ├── index.ts         # Public API
│   │       └── worker-client.ts # Worker client class
```

## Implementation

### 1. Web Worker (`public/workers/tts-worker.js`)
- Import ONNX Runtime
- Load model from cache or fetch
- Run inference pipeline
- Stream progress via postMessage

### 2. Worker Client (`lib/tts/worker-client.ts`)
- Create/manage Worker instance
- Send messages to worker
- Handle responses and progress
- Cleanup and terminate

### 3. Public API (`lib/tts/index.ts`)
- Export TTS service

## Worker Communication Protocol

```javascript
// Main → Worker
{ type: 'generate', text, options }
{ type: 'cancel' }
{ type: 'terminate' }

// Worker → Main
{ type: 'ready' }
{ type: 'progress', value: 0-100 }
{ type: 'audio', blob }
{ type: 'error', message }
```

## Dependencies

- [x] F2.5 (TTS Generator UI)
- [x] F2.6 (IndexedDB Caching)

---

# Implementation Steps

- [x] 1. Create `.sdlc/SPECF2.7-frontend-onnx-runtime-worker/plan.md`
- [x] 2. Create `frontend/public/workers/tts-worker.js`
- [x] 3. Create `frontend/src/lib/tts/worker-client.ts`
- [x] 4. Create `frontend/src/lib/tts/index.ts`
- [x] 5. Verify with TypeScript ✅