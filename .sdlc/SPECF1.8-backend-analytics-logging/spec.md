# SPEC: F1.8 - Basic Analytics Logging

## Overview
Triển khai hệ thống logging cơ bản cho analytics - ghi nhận API requests/responses và usage statistics để phục vụ theo dõi, tối ưu hóa, và tính metrics cho admin.

---

## Functional Requirements

### Core Features
- [ ] **Request Logging Middleware**: Tự động ghi nhận tất cả API requests (method, path, status, latency, user_id)
- [ ] **Usage Statistics**: Ghi nhận quota usage theo user (characters used, API calls made)
- [ ] **Analytics Table**: Lưu trữ logs vào database (PostgreSQL)
- [ ] **Admin API Endpoint**: Trả về analytics data cho admin dashboard

### Data to Track
1. **Request Log**:
   - `timestamp`: When request was made
   - `method`: HTTP method (GET, POST, etc.)
   - `path`: API endpoint path
   - `status_code`: Response status (200, 401, 429, etc.)
   - `latency_ms`: Response time in milliseconds
   - `user_id`: User ID (if authenticated, else null)
   - `ip_address`: Client IP address
   - `user_agent`: Client user agent

2. **Usage Log**:
   - `user_id`: User ID
   - `feature`: Feature name (tts_generate, etc.)
   - `characters_used`: Number of characters processed
   - `api_calls`: Number of API calls made
   - `period`: Time period (daily aggregation)

---

## Acceptance Criteria

- [ ] Middleware ghi nhận tất cả requests đến `/api/*` endpoints
- [ ] Logs được lưu vào database với schema hợp lý
- [ ] Admin có thể truy vấn: total requests, average latency, usage by user
- [ ] Performance impact < 5% (non-blocking logging)
- [ ] Fallback graceful khi database unavailable

---

## API Contract

### GET /api/admin/analytics

**Authorization:** Requires `admin` role (or user with `is_admin=True`)

**Success Response (200):**
```json
{
  "total_requests": 15420,
  "total_users": 234,
  "average_latency_ms": 145,
  "requests_today": 1234,
  "requests_by_endpoint": [
    {"path": "/api/v1/auth/login", "count": 5200},
    {"path": "/api/v1/tts/generate", "count": 3800}
  ],
  "top_users": [
    {"user_id": 1, "requests": 4500},
    {"user_id": 5, "requests": 2100}
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User not admin
- `500 Internal Server Error`: Database error

---

## Database Schema

```sql
-- Request logs table
CREATE TABLE request_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512)
);

CREATE INDEX idx_request_logs_timestamp ON request_logs(timestamp);
CREATE INDEX idx_request_logs_user_id ON request_logs(user_id);
CREATE INDEX idx_request_logs_path ON request_logs(path);

-- Usage snapshots table (daily aggregation per feature)
CREATE TABLE usage_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    feature VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    characters_used INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    UNIQUE(user_id, feature, date)
);
```

---

## Edge Cases

| Edge Case | Handling |
|----------|----------|
| Database unavailable | Log to stderr, continue request |
| Large payload | Log truncated user_agent (max 512 chars) |
| No user authenticated | Log with user_id = null |
| High traffic | Use batch insert, not per-request |

---

## Test Strategy

- **Unit Tests**: Test logging middleware captures correct data
- **Integration Tests**: Verify logs are written to database
- **Performance**: Ensure < 5% latency overhead

---

## Dependencies
- [x] F1.1 (FastAPI Auth)
- [x] F1.2 (PostgreSQL Database)

---

# 👉 APPROVE to proceed with implementation?

Vui lòng review bản SPEC ở trên:
- ✅ **APPROVE** - Tiến hành triển khai kịch bản này
- ❌ **REJECT** - Từ chối và chỉ định điểm cần thay đổi
- ❓ **HAVE QUESTIONS** - Đặt câu hỏi nếu có gì chưa rõ