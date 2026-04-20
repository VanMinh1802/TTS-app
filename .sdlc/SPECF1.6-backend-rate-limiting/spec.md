# SPEC: F1.6 - Rate Limiting với Redis

## Overview
Triển khai hệ thống Rate Limiting mạnh mẽ sử dụng Redis để bảo vệ các API endpoints khỏi lạm dụng, đảm bảo tính công bằng (fair usage), và phân loại giới hạn theo từng nhóm người dùng (dựa trên IP, JWT User Tier, hoặc API Key).

---

## Functional Requirements
- [ ] Tích hợp kết nối FastAPI application với Redis server.
- [ ] Triển khai Rate-Limiting Dependency cho FastAPI (có thể dùng thư viện `fastapi-limiter` hoặc tự viết token bucket / sliding window log algorithm).
- [ ] Hỗ trợ Rate Limiting dựa trên IP (dành cho các endpoint public/guest).
- [ ] Hỗ trợ Rate Limiting dựa trên User ID từ JWT (dành cho người dùng đăng nhập), giới hạn thay đổi theo Subscription Tier.
- [ ] Trả về đầy đủ các thông tin qua HTTP Headers chuẩn: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` và `Retry-After`.

---

## Acceptance Criteria
- [ ] Module kết nối Redis khởi tạo thành công lúc App Start và đóng kết nối an toàn lúc App Shutdown.
- [ ] Endpoint Public: Giới hạn theo IP của Client (Lưu ý lấy đúng IP từ `X-Forwarded-For` hoặc `CF-Connecting-IP` nếu đứng sau Proxy/Cloudflare).
- [ ] Endpoint Protected: Giới hạn theo User ID. Báo `429 Too Many Requests` khi user gọi quá nhịp cho phép.
- [ ] Response headers phản hồi chính xác số request còn lại ngay tức thời theo thời gian thực.
- [ ] Khi Redis gặp sự cố (Fail/Down), Rate Limiter có cơ chế Fallback (Bỏ qua Rate limit để tránh gây sập toàn hệ thống) hoặc log lại Error.

---

## API Contract (Response khi dính Rate Limit)

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1714001234
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded. Please try again in 45 seconds.",
  "retry_after": 45
}
```

---

## Edge Cases
| Edge Case | Handling |
|-----------|----------|
| Redis Connection Timeout | Theo cấu hình: Block request hoặc Bypass rate limit để hệ thống vẫn sống. |
| Client Fake IP/Proxies | Cần config trust proxies chính xác, chỉ nhận IP từ header của Nginx/Cloudflare đáng tin cậy. |
| API Key Rate Limit | Rate limit được ghi đè dựa trên giới hạn của API Key ở F1.5 (nếu call theo API Key). |

---

## Test Strategy
- **Unit Tests**: Mock Redis Database (`fakeredis`) để kiểm tra thuật toán sliding_window/token_bucket trả về block sau Request thứ N chính xác.
- **Integration Tests**: Giả lập vòng lặp bắn 50 requests liên tục vào 1 endpoint được bảo vệ để verify xem từ request thứ bao nhiêu sẽ trả về HTTP 429 và kiểm tra Headers.

---

## Dependencies
- [x] F1.1 (FastAPI Auth)
- [x] F1.5 (API Key Management)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review lại bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ
