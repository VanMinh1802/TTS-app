# SPEC: F2.7 - ONNX Runtime Web Worker

## Overview
Triển khai Web Worker để chạy ONNX TTS inference trên background thread, tránh blocking UI thread và đảm bảo trải nghiệm mượt mà khi generate speech.

---

## Functional Requirements

### Core Features
- [ ] **Web Worker Setup**: Tạo dedicated worker cho ONNX inference
- [ ] **Inference Pipeline**: Nhận text → chạy model → trả về audio
- [ ] **Worker Communication**: Message-based API với main thread
- [ ] **Progress Events**: Stream progress updates về main thread
- [ ] **Error Handling**: Xử lý lỗi graceful, fallback to server-side nếu cần

### Workflow
1. Main thread gửi text + config đến worker
2. Worker load model (từ cache hoặc fetch mới)
3. Worker chạy inference, stream progress
4. Worker gửi audio blob về main thread
5. Main thread play audio

---

## Acceptance Criteria

- [ ] TTS inference chạy trên Worker thread (không block UI)
- [ ] Progress updates được stream về UI
- [ ] Lỗi worker có fallback to server-side API
- [ ] Worker có thể bị terminate khi không cần
- [ ] Memory được giải phóng khi unload worker

---

## API Contract

### Main Thread API

```typescript
interface TTSWorker {
  // Generate speech (async)
  generate(text: string, options: TTSOptions): Promise<AudioBuffer>;

  // Stream progress
  onProgress(callback: (progress: number) => void): void;

  // Cancel current generation
  cancel(): void;

  // Terminate worker
  terminate(): void;
}

interface TTSOptions {
  voiceId: string;
  sampleRate?: number;
  speed?: number;
}
```

### Worker Messages

| From | To | Payload |
|------|-----|---------|
| Main | Worker | `{type: 'generate', text, options}` |
| Worker | Main | `{type: 'progress', value}` |
| Worker | Main | `{type: 'audio', blob}` |
| Worker | Main | `{type: 'error', message}` |
| Main | Worker | `{type: 'cancel'}` |

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Worker not supported | Fallback to server-side API |
| Out of memory | Unload worker, retry on server |
| Worker crash | Detect, restart worker |
| Long text | Chunk and process sequentially |

---

## Dependencies

- [x] F2.5 (TTS Generator UI)
- [x] F2.6 (IndexedDB Caching)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ