# SPEC: F2.6 - IndexedDB Model Caching

## Overview
Triển khai hệ thống caching cho TTS models sử dụng IndexedDB để lưu trữ models (ONNX) ở client-side, giúp giảm thời gian tải lần sau và cho phép offline usage.

---

## Functional Requirements

### Core Features
- [ ] **IndexedDB Setup**: Khởi tạo IndexedDB database với schema phù hợp
- [ ] **Model Storage**: Lưu trữ ONNX model files vào IndexedDB
- [ ] **Cache Management**: Theo dõi models đã cached, xóa cache khi cần
- [ ] **Version Control**: Kiểm tra version của cached model vs remote
- [ ] **Loading States**: Hiển thị progress khi đang download/cache model

### Data to Store
1. **Models**:
   - `id`: Model identifier
   - `name`: Model name (e.g., "piper-vi-female")
   - `version`: Model version
   - `blob`: ArrayBuffer of model file
   - `size`: Size in bytes
   - `cachedAt`: Timestamp
   - `lastAccessed`: Timestamp

2. **Metadata**:
   - `totalCacheSize`: Total cached size
   - `maxCacheSize`: Maximum allowed cache (default: 500MB)

---

## Acceptance Criteria

- [ ] Models được lưu vào IndexedDB sau lần đầu download
- [ ] Lần sau load nhanh hơn (sử dụng cache thay vì download)
- [ ] Progress bar hiển thị khi đang cache model
- [ ] Cache có thể bị xóa thủ công
- [ ] Tự động cleanup khi vượt max cache size
- [ ] Version mismatch tự động re-download

---

## API Contract

### JavaScript API

```typescript
interface CacheService {
  // Check if model is cached
  isCached(modelId: string): Promise<boolean>;
  
  // Get model from cache
  getModel(modelId: string): Promise<ArrayBuffer | null>;
  
  // Cache model
  cacheModel(modelId: string, data: ArrayBuffer): Promise<void>;
  
  // Get cache status
  getCacheInfo(): Promise<{totalSize: number, models: string[]}>;
  
  // Clear cache
  clearCache(): Promise<void>;
  
  // Check version
  checkVersion(modelId: string, remoteVersion: string): Promise<boolean>;
}
```

---

## Edge Cases

| Edge Case | Handling |
|----------|----------|
| IndexedDB not supported | Fallback to memory cache |
| Storage quota exceeded | Auto-cleanup oldest models |
| Corrupted data | Re-download model |
| No network | Use cached model only |

---

## Dependencies
- [x] F2.5 (TTS Generator UI)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ