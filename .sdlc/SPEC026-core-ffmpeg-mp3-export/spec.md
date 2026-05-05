# Feature: FFmpeg.wasm MP3 Export

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-05
> **Related Issues:** #

---

## 1. Problem Statement

### 1.1 User Problem

Current audio pipeline stores and exports exclusively WAV (PCM 16-bit, mono). One minute of audio = ~2.5MB WAV, which is ~10x larger than equivalent MP3. This causes:

- IndexedDB storage quota fills quickly (50-200MB browser limit → only 20-80 minutes of audio)
- R2 cloud storage costs are 10x higher than necessary
- Downloads are slow on mobile/limited bandwidth
- Quota limits for PRO users are hit quickly

### 1.2 Business Impact

- Users hit storage quotas faster → churn risk for PRO subscription
- Higher R2 storage and bandwidth costs for the business
- Poor mobile experience limits addressable market

### 1.3 Success Criteria

- [ ] 1 minute audio: <300KB MP3 (vs ~2.5MB WAV) — ~88% storage reduction
- [ ] FFmpeg.wasm conversion time: <2 seconds for 1 minute audio
- [ ] FFmpeg.wasm core first load: <5 seconds (CDN-cached on subsequent loads)
- [ ] Download button offers both MP3 (stored) and WAV (in-memory, current session only)
- [ ] Backward compatible: existing WAV-only records in IndexedDB continue to work

---

## 2. User Stories & Acceptance Criteria

### Story 1: Tự động chuyển đổi sang MP3 sau khi generate

**As a** người dùng TTS studio,
**I want** audio tự động được nén sang MP3 sau khi generate,
**so that** tôi có thể lưu nhiều audio hơn trong Library mà không lo hết dung lượng.

#### Acceptance Criteria

- **Given** user generates TTS thành công (worker hoặc server path), **When** pipeline hoàn tất, **Then** MP3 được lưu vào IndexedDB với `audio_mp3` field, `file_size_bytes` phản ánh kích thước MP3 thực tế
- **Given** FFmpeg.wasm convert thất bại (timeout, OOM), **When** pipeline chạy, **Then** fallback lưu WAV vào `audio_mp3` field, hiển thị toast warning "Không thể nén MP3, đã lưu bản WAV"

### Story 2: Tải audio với lựa chọn MP3 hoặc WAV

**As a** người dùng mới generate audio,
**I want** được chọn tải bản MP3 (nhẹ) hoặc WAV (lossless),
**so that** tôi có thể chọn chất lượng phù hợp với nhu cầu.

#### Acceptance Criteria

- **Given** user vừa generate audio trong Studio, **When** user click nút Download, **Then** hiển thị dropdown với 2 lựa chọn: "MP3 (~XXX KB)" và "WAV (~X.X MB)"
- **Given** user click "MP3", **When** download bắt đầu, **Then** file tải về có tên `genvoice-audio.mp3` và là file MP3 hợp lệ
- **Given** user click "WAV", **When** download bắt đầu, **Then** file tải về có tên `genvoice-audio.wav` và là file WAV hợp lệ từ memory buffer
- **Given** user vào Library xem audio cũ (không còn WAV buffer), **When** user click Download, **Then** chỉ hiển thị lựa chọn MP3, không có WAV

### Story 3: Sync MP3 lên cloud

**As a** PRO user,
**I want** audio được sync lên R2 cloud dưới dạng MP3,
**so that** tôi tiết kiệm dung lượng cloud storage và sync nhanh hơn.

#### Acceptance Criteria

- **Given** user có audio MP3 trong IndexedDB, **When** user sync lên cloud, **Then** backend nhận `audio_mp3` field, upload lên R2 với content-type `audio/mpeg`, file_url có đuôi `.mp3`
- **Given** user có audio WAV cũ (chưa có `audio_mp3`), **When** user sync lên cloud, **Then** backend vẫn nhận field cũ `audio_data` (WAV) và upload bình thường (backward compat)

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Sau TTS generation, gọi `convertWavToMp3(wavBuffer, sampleRate)` để chuyển WAV → MP3 @ 128kbps CBR | Must |
| FR-2 | Lưu MP3 data URL vào IndexedDB field `audio_mp3` thay vì `audio_url` cũ | Must |
| FR-3 | Giữ WAV buffer trong memory (không lưu IndexedDB) để download WAV trong phiên hiện tại | Must |
| FR-4 | Download button trong Studio hiển thị dropdown chọn MP3 hoặc WAV | Must |
| FR-5 | Download button trong Library chỉ hiển thị MP3 (WAV đã hết hạn) | Must |
| FR-6 | Backend `POST /library/sync` hỗ trợ field mới `audio_mp3` (MP3) bên cạnh field cũ `audio_data` (WAV) | Must |
| FR-7 | Nếu cả `audio_mp3` và `audio_data` đều có → ưu tiên `audio_mp3` | Must |
| FR-8 | Backend upload MP3 lên R2 với content-type `audio/mpeg`, key `audio/{user_id}/{record_id}.mp3` | Must |
| FR-9 | FFmpeg.wasm lazy load — chỉ load core khi user generate lần đầu | Should |
| FR-10 | FFmpeg.wasm conversion timeout 30 giây, fallback WAV nếu quá hạn | Must |

### 3.2 Edge Cases

- Audio <1 giây (rất ngắn) — vẫn convert MP3 bình thường
- Audio >10 phút — conversion có thể chậm, timeout 30 giây, fallback WAV
- Browser không hỗ trợ SharedArrayBuffer / cross-origin isolation → FFmpeg.wasm không hoạt động → fallback WAV, toast hướng dẫn
- IndexedDB đầy ngay cả với MP3 → toast yêu cầu xóa audio cũ
- User F5/reload trang → WAV buffer mất, chỉ còn MP3 trong IndexedDB
- User mở Library trên thiết bị khác (không có IndexedDB) → audio từ R2 được load qua public URL (MP3)

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| FFmpeg.wasm core không load được (mạng chậm/CDN lỗi) | Timeout 15s → fallback WAV, toast "Không tải được MP3 converter, đã lưu bản WAV" |
| Conversion crash (OOM với file quá dài) | Bắt lỗi → fallback WAV, toast "File quá dài, đã lưu bản WAV" |
| Browser không hỗ trợ SharedArrayBuffer | Fallback WAV, toast "Trình duyệt không hỗ trợ nén MP3" |
| Backend nhận `audio_mp3` rỗng/null | Bỏ qua, kiểm tra `audio_data` field cũ |
| Backend nhận `audio_mp3` không decode được base64 | Log warning, fallback `audio_data` |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- FFmpeg.wasm core load (lần đầu): < 5 giây (từ CDN jsDelivr/unpkg)
- WAV → MP3 conversion (1 phút audio): < 2 giây
- TTS generation tổng thời gian tăng thêm: +1-3 giây (conversion + core load nếu lần đầu)
- IndexedDB storage (1 phút audio): ~300KB MP3 vs ~2.5MB WAV

### 4.2 Security

- FFmpeg.wasm chạy hoàn toàn trong browser (WASM sandbox), không gửi audio ra ngoài
- Cross-Origin-Opener-Policy: same-origin (yêu cầu của FFmpeg.wasm)
- Cross-Origin-Embedder-Policy: require-corp (yêu cầu của FFmpeg.wasm)
- COOP/COEP headers phải tương thích với Google OAuth popup và R2 CDN CORS

### 4.3 Constraints

- Platform: Browser hỗ trợ WebAssembly + SharedArrayBuffer
- Dependencies: `@ffmpeg/ffmpeg@^0.12`, `@ffmpeg/util@^0.12`
- Bundle size impact: ~8MB WASM (gzipped ~2.5MB), lazy loaded
- Compatibility: Phải tương thích với cả 2 TTS paths (Web Worker ONNX + Server API)
- Backward compatibility: IndexedDB records cũ (chỉ có `audio_url`) vẫn đọc được

### 4.4 COOP/COEP Impact Analysis

FFmpeg.wasm requires `SharedArrayBuffer` which requires cross-origin isolation. Adding COOP/COEP headers may affect:

1. **Google OAuth**: Uses `window.open()` popup → COOP: `same-origin` may break cross-origin popups. Solution: COOP `same-origin-allow-popups` (less strict, allows popups)
2. **R2 CDN resources**: ONNX models, voice samples loaded from Cloudflare R2 (cross-origin) → COEP: `require-corp` will block them unless R2 sends `Cross-Origin-Resource-Policy: cross-origin`. Solution: Verify R2 CORS config, use COEP `credentialless` if CORS issues persist
3. **Google Fonts / CDN scripts**: Must send CORP headers or use COEP `credentialless`
4. **Google Gemini API**: Calls from frontend via `X-LLM-API-Key` header → same-origin through Next.js proxy → unaffected

---

## 5. Unit Test Cases (TDD)

> **TDD Required:** Every test case below must be implemented using RED-GREEN-REFACTOR cycle.

### 5.1 The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### 5.2 Test Case Registry

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | `backend/tests/services/test_library_sync.py` | Backend: sync endpoint accepts `audio_mp3` field, uploads as audio/mpeg | RED |
| TC-02 | `backend/tests/services/test_library_sync.py` | Backend: sync endpoint backward compat with `audio_data` (WAV) | RED |
| TC-03 | `backend/tests/services/test_library_sync.py` | Backend: both `audio_mp3` + `audio_data` → prioritize `audio_mp3` | RED |
| TC-04 | `frontend/src/lib/audio/mp3.test.ts` | `convertWavToMp3(validWav, 22050)` → Blob type=audio/mpeg, size < 15% WAV | RED |
| TC-05 | `frontend/src/lib/audio/mp3.test.ts` | `convertWavToMp3(emptyBuffer)` → rejects with error | RED |

### 5.3 Test Case Template

#### TC-01: Backend accepts audio_mp3 field

**Given** (setup):
> Backend running, R2 mock active

**When** (action):
> POST /library/sync with `records[].audio_mp3 = "data:audio/mpeg;base64,..."`

**Then** (assertion):
> R2 upload called with content_type `audio/mpeg`, key ending in `.mp3`

---

#### TC-04: convertWavToMp3 produces valid MP3

**Given** (setup):
> Valid WAV ArrayBuffer (PCM 16-bit, 22050 Hz, 1 sec), FFmpeg.wasm mock loaded

**When** (action):
> `convertWavToMp3(wavBuffer, 22050)`

**Then** (assertion):
> Returns Blob with `type === 'audio/mpeg'`, blob.size < wavBuffer.byteLength * 0.15

---

### 5.6 TDD Verification Checklist

- [ ] **RED:** Test written first, before any implementation code
- [ ] **RED:** Ran test, confirmed it FAILS with expected error
- [ ] **RED:** Failure is because feature is missing (not typo in test)
- [ ] **GREEN:** Wrote minimal code to pass the test
- [ ] **GREEN:** Ran test, confirmed it PASSES
- [ ] **GREEN:** No other existing tests broke
- [ ] **REFACTOR:** Cleaned up if needed, tests stayed green
- [ ] **Anti-pattern check:** No testing mock behavior, no partial mocks

---

## 6. Boundaries

### [ALLOW] Always Do

- Convert WAV → MP3 immediately after TTS generation before storing
- Keep WAV buffer in memory for current-session download
- Fall back to WAV silently on conversion failure (with user toast)
- Lazy load FFmpeg.wasm core only when needed
- Test both TTS paths (Web Worker + Server API) with MP3 conversion

### [CAUTION] Ask First

- Changing MP3 bitrate from 128kbps default
- Adding other formats (OGG, FLAC, AAC)
- Adding format quality selector UI
- Changing COOP/COEP header policy

### [FORBID] Never Do

- Remove WAV buffer before download completes (data loss)
- Convert on backend (scope is frontend-only conversion)
- Load FFmpeg.wasm eagerly (unnecessary bandwidth for non-TTS users)
- Block existing WAV-only IndexedDB records from playback
- Write production code before writing test first

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | TDD Status |
|-------------|-------------|------------|
| FR-1: convertWavToMp3 | Unit (TC-04, TC-05) | Pending (RED) |
| FR-2: Save MP3 to IndexedDB | Integration (Playwright TC-07) | Manual |
| FR-3: Keep WAV in memory | Integration (Playwright TC-08) | Manual |
| FR-4: Studio download dropdown | E2E (Playwright TC-08) | Manual |
| FR-5: Library download MP3 only | E2E (Playwright TC-09) | Manual |
| FR-6: Backend accepts audio_mp3 | Unit (TC-01) | Pending (RED) |
| FR-7: Prioritize audio_mp3 | Unit (TC-03) | Pending (RED) |
| FR-8: Backend uploads MP3 to R2 | Unit (TC-01) | Pending (RED) |
| FR-9: FFmpeg lazy load | Manual (DevTools Network) | Manual |
| FR-10: Conversion timeout | Unit (TC-05 variant) | Pending (RED) |

### 7.2 Acceptance Checklist

- [ ] All user stories implemented
- [ ] All acceptance criteria met
- [ ] Edge cases handled (empty audio, long audio, browser isolation)
- [ ] Error responses match spec
- [ ] Performance targets achieved (<2s conversion, <5s core load)
- [ ] All TDD test cases follow RED-GREEN-REFACTOR cycle
- [ ] Each test verified RED before GREEN
- [ ] Tests pass with required coverage
- [ ] No boundary violations
- [ ] COOP/COEP headers deployed and verified
- [ ] Google OAuth login still works after COOP/COEP
- [ ] R2 CDN resources load correctly after COEP

---

## 8. Out of Scope

- Backend-side audio conversion (FFmpeg native)
- Global format preference setting (e.g., Settings page toggle for default download format)
- OGG/FLAC/AAC/other format support
- Configurable MP3 bitrate (fixed 128kbps CBR)
- Audio editing/trimming before conversion
- Batch conversion of existing library records
- Server-side streaming while converting

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-05 | v1.0 | Kilo | Initial spec | — | All |
