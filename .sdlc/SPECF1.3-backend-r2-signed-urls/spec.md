# SPEC: F1.3 - Cloudflare R2 Signed URL Generation

## Overview
Implement backend endpoints to generate signed URLs for Cloudflare R2 object storage. This enables secure, time-limited access to TTS model files without exposing credentials.

---

## Functional Requirements

### F1.3.1 - R2 Configuration
- [x] Configure Cloudflare R2 credentials in environment
- [x] Set up R2 client with boto3 compatibility
- [x] Define bucket and model path structure

### F1.3.2 - Signed URL Generation
- [x] Implement signed URL generation endpoint
- [x] Configure expiration time (default: 1 hour)
- [x] Support both model download and audio upload URLs

### F1.3.3 - Model Metadata API
- [x] List available TTS models (from config file)
- [x] Get model metadata (size, version, voice info)
- [x] Cache model list for performance (5 minute TTL)

---

## Acceptance Criteria

### F1.3.1 - R2 Configuration
- [x] R2 credentials configured via environment variables
- [x] Connection to R2 verified

### F1.3.2 - Signed URLs
- [x] `POST /api/models/{model_id}/download-url` returns signed URL
- [x] `POST /api/audio/upload-url` returns signed upload URL
- [x] URLs expire after configured time
- [x] Invalid model_id returns 404

### F1.3.3 - Model Metadata
- [x] `GET /api/models` returns list of available models (from config)
- [x] `GET /api/models/{model_id}` returns model metadata

---

## API Contracts

### Get Model Download URL

```
POST /api/models/{model_id}/download-url
Headers: Authorization: Bearer <jwt_token>

Authentication & Authorization:
- JWT token from F1.1 /login endpoint
- Any authenticated user can access any model (open model library)
- Access control: User must have valid JWT token (no role-based restrictions)

Note: Model files are part of the service offering - all authenticated users can download any model.
- Token validated via F1.1 auth logic
- user_id extracted from token payload

Response (200):
{
  "url": "https://r2.example.com/models/piper-vi-en-medium.onnx?X-Amz-Algorithm=...",
  "expires_in": 3600,
  "model_id": "piper-vi-en-medium",
  "model_size": 52345678
}

Error Responses:
- 401: Invalid or missing token
- 404: Model not found
- 503: R2 service unavailable
```

### Get Upload URL

```
POST /api/audio/upload-url
Headers: Authorization: Bearer <jwt_token>

Authentication: JWT token from F1.1 /login endpoint
- user_id extracted from token payload
- Upload path: audio/{user_id}/{filename}

Request:
{
  "filename": "output.wav",
  "content_type": "audio/wav"
}

Response (200):
{
  "upload_url": "https://r2.example.com/audio/user-123/output.wav?X-Amz-Algorithm=...",
  "expires_in": 3600,
  "fields": {
    "key": "audio/user-123/output.wav",
    "Content-Type": "audio/wav"
  },
  "user_id": "user-123"
}

Error Responses:
- 401: Invalid or missing token
- 413: File too large (max 100MB)
- 503: R2 service unavailable
```

### List Models

```
GET /api/models
Response (200):
{
  "models": [
    {
      "id": "piper-vi-en-medium",
      "name": "Piper Vietnamese English Medium",
      "description": "High quality Vietnamese & English TTS",
      "size": 52345678,
      "voices": ["female", "male"],
      "languages": ["vi", "en"]
    }
  ]
}
```

---

## Configuration

```python
# Environment Variables
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=genvoice-models
R2_ACCOUNT_ID=your_account_id
R2_PUBLIC_URL=https://r2.example.com

# URL Expiration
SIGNED_URL_EXPIRE_SECONDS=3600
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Invalid model_id | Return 404 Not Found (see error response schema) |
| R2 connection failure | Return 503 Service Unavailable |
| Expired signature | Return 403 Forbidden |
| Missing R2 credentials | Return 500 with clear error |
| File too large (>100MB) | Return 413 Payload Too Large |
| Invalid/missing JWT token | Return 401 Unauthorized |
| User not found for upload | Return 401 Unauthorized |

---

## Dependencies

- [x] F1.1 (FastAPI Auth) - Required for JWT token validation
- [x] F1.2 (PostgreSQL) - Not used (model metadata from config file)

---

## Status: COMPLETED ✅

Implemented:
- F1.3.1 - R2 Configuration
- F1.3.2 - Signed URL Generation  
- F1.3.3 - Model Metadata API

Tests: 16 total (7 new + 9 auth)

---

## Implementation Estimate

- **Effort**: Low-Medium
- **Complexity**: Low
- **Estimated Time**: 1-2 hours

---

# 👉 APPROVE to proceed with implementation?

Please review the SPEC above and let me know:
- ✅ APPROVE - proceed with implementation
- ❌ REJECT - specify what needs to change
- ❓ HAVE QUESTIONS - ask for clarification