# Feature: Phase 6 - Developer Tools

> **Status:** Draft
> **Author:** AI Agent
> **Date:** 2026-04-20
> **Related Issues:** Phase 6 from SPEC001-core-enhanced-tts-application

---

## 1. Problem Statement

### 1.1 User Problem

Developers integrating with the TTS API lack proper documentation, type-safe SDKs, and standardized error handling. This creates friction in adoption and increases support burden.

### 1.2 Business Impact

- Developer API adoption target: >500 active keys/month
- Reduced integration support tickets
- Faster time-to-first-audio for developers

### 1.3 Success Criteria

- [ ] OpenAPI documentation auto-generated and accessible at /docs
- [ ] TypeScript SDK published to NPM with full type definitions
- [ ] Standardized error codes implemented across all endpoints
- [ ] Integration guides covering common use cases

---

## 2. User Stories & Acceptance Criteria

### Story 1: OpenAPI Documentation

**As a** developer,
**I want** to access auto-generated API documentation,
**so that** I can understand available endpoints and try them directly.

#### Acceptance Criteria

- **Given** I am authenticated,
  **When** I navigate to /docs,
  **Then** I see full Swagger UI with all endpoints.

- **Given** I am unauthenticated,
  **When** I navigate to /docs,
  **Then** I see public endpoints only (no auth required).

- **Given** I am a logged-in user,
  **When** I use the "Try it out" button on a protected endpoint,
  **Then** I can execute requests with my JWT token.

### Story 2: TypeScript SDK

**As a** frontend developer,
**I want** a type-safe JavaScript/TypeScript SDK,
**so that** I can integrate TTS without manually defining types.

#### Acceptance Criteria

- **Given** I install genvoice-web-sdk from NPM,
  **When** I import TTSClient,
  **Then** I get full TypeScript autocomplete for all methods.

- **Given** I call client.generateTTS(text, options),
  **When** I provide invalid parameters,
  **Then** TypeScript compilation fails with clear error messages.

- **Given** I use the SDK in a Next.js project,
  **When** I build the project,
  **Then** no type errors occur.

### Story 3: Standardized Error Codes

**As a** developer,
**I want** consistent error responses,
**so that** I can handle errors programmatically.

#### Acceptance Criteria

- **Given** I make a request with an invalid API key,
  **When** the request fails,
  **Then** I receive error code AUTH_INVALID_KEY with message "Invalid API key".

- **Given** I exceed my quota,
  **When** I make a TTS request,
  **Then** I receive error code QUOTA_EXCEEDED with remaining quota info.

- **Given** I submit invalid SSML,
  **When** I call the normalize endpoint,
  **Then** I receive error code SSML_INVALID with parsing details.

### Story 4: Integration Guides

**As a** developer,
**I want** comprehensive guides for common integrations,
**so that** I can quickly get started with my use case.

#### Acceptance Criteria

- **Given** I am a new developer,
  **When** I visit the integration docs page,
  **Then** I see guides for: Next.js, React, Vue, Vanilla JS.

- **Given** I follow the React integration guide,
  **When** I complete all steps,
  **Then** I have a working TTS demo running.

---

## 3. Functional Requirements

### 3.1 OpenAPI Documentation (F6.1)

| Requirement | Description |
|------------|-------------|
| F6.1.1 | Auto-generate OpenAPI spec from FastAPI routes |
| F6.1.2 | Serve Swagger UI at /docs endpoint |
| F6.1.3 | Serve ReDoc at /redoc endpoint |
| F6.1.4 | Include request/response schemas for all endpoints |
| F6.1.5 | Support JWT Bearer token authentication in Swagger |

### 3.2 TypeScript SDK Package (F6.2)

| Requirement | Description |
|------------|-------------|
| F6.2.1 | Create npm package genvoice-web-sdk |
| F6.2.2 | Export TTSClient class with all API methods |
| F6.2.3 | Include TypeScript definitions |
| F6.2.4 | Support both ESM and CommonJS |
| F6.2.5 | Document installation and basic usage |

### 3.3 Error Code Standardization (F6.3)

| Requirement | Description |
|------------|-------------|
| F6.3.1 | Define error code enum in core/exceptions.py |
| F6.3.2 | Implement error response factory |
| F6.3.3 | Apply standardized errors to all API endpoints |
| F6.3.4 | Document error codes in OpenAPI spec |

### 3.4 Integration Guides (F6.4)

| Requirement | Description |
|------------|-------------|
| F6.4.1 | Create markdown guides in docs/ directory |
| F6.4.2 | Guide: Quick Start (5 min) |
| F6.4.3 | Guide: React Integration |
| F6.4.4 | Guide: Next.js Integration |
| F6.4.5 | Guide: Vue.js Integration |
| F6.4.6 | Guide: Error Handling |
| F6.4.7 | Host guides at /api-docs endpoint |

---

## 4. Proposed Folder Structure

### 4.1 New Files & Directories

```
backend/
├── app/
│   ├── core/
│   │   ├── exceptions.py          # F6.3: Error codes
│   │   └── openapi.py             # F6.1: OpenAPI config
│   └── main.py                    # Modify: add swagger routes
docs/
├── F6.4-integration-guides/      # New directory
│   ├── index.md
│   ├── quickstart.md
│   ├── react.md
│   ├── nextjs.md
│   └── error-handling.md
frontend/
├── packages/
│   └── genvoice-web-sdk/          # F6.2: New SDK package
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── client.ts
│       │   ├── types.ts
│       │   └── errors.ts
│       ├── tsconfig.json
│       └── README.md
```

### 4.2 Modified Files

| File | Modification |
|------|-------------|
| backend/app/main.py | Add Swagger UI routes |
| backend/app/api/*.py | Use standardized errors |

---

## 5. Data Model

### 5.1 Error Code Enum

```python
class ErrorCode(str, Enum):
    # Authentication errors (AUTH_*)
    AUTH_INVALID_KEY = "AUTH_INVALID_KEY"
    AUTH_EXPIRED_TOKEN = "AUTH_EXPIRED_TOKEN"
    AUTH_MISSING_PERMISSION = "AUTH_MISSING_PERMISSION"

    # Quota errors (QUOTA_*)
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    QUOTA_INSUFFICIENT = "QUOTA_INSUFFICIENT"

    # Validation errors (VALIDATION_*)
    VALIDATION_TEXT_EMPTY = "VALIDATION_TEXT_EMPTY"
    VALIDATION_TEXT_TOO_LONG = "VALIDATION_TEXT_TOO_LONG"
    VALIDATION_SSML_INVALID = "VALIDATION_SSML_INVALID"

    # Resource errors (RESOURCE_*)
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"

    # Rate limit errors (RATE_LIMIT_*)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

    # Server errors (SERVER_*)
    SERVER_INTERNAL_ERROR = "SERVER_INTERNAL_ERROR"
    SERVER_EXTERNAL_SERVICE_ERROR = "SERVER_EXTERNAL_SERVICE_ERROR"
```

### 5.2 Error Response Schema

```python
class ErrorResponse(BaseModel):
    error_code: ErrorCode
    message: str
    details: dict | None = None
    request_id: str
    timestamp: datetime
```

---

## 6. API Contracts

### 6.1 OpenAPI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /docs | GET | Swagger UI |
| /redoc | GET | ReDoc UI |
| /openapi.json | GET | OpenAPI spec (JSON) |

### 6.2 Error Response Examples

```json
// 401 - Invalid API Key
{
  "error_code": "AUTH_INVALID_KEY",
  "message": "Invalid API key",
  "details": null,
  "request_id": "req_abc123",
  "timestamp": "2026-04-20T10:00:00Z"
}

// 429 - Quota Exceeded
{
  "error_code": "QUOTA_EXCEEDED",
  "message": "Monthly quota exceeded",
  "details": {
    "limit": 10000,
    "used": 10000,
    "reset_at": "2026-05-01T00:00:00Z"
  },
  "request_id": "req_abc123",
  "timestamp": "2026-04-20T10:00:00Z"
}
```

---

## 7. Edge Cases & Error Handling

| ID | Scenario | Expected Behavior | Severity |
|----|----------|-------------------|------------|
| EC-01 | OpenAPI spec fails to generate | Fallback to basic spec, log error | HIGH |
| EC-02 | SDK version incompatible | Show clear upgrade message | MEDIUM |
| EC-03 | Network timeout during docs load | Show cached version if available | LOW |

---

## 8. Unit Test Cases (TDD)

### 8.1 Test Case Registry

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | backend/app/core/exceptions_test.py | ErrorCode enum values | RED |
| TC-02 | backend/app/core/exceptions_test.py | ErrorResponse serialization | RED |
| TC-03 | backend/app/api/openapi_test.py | Swagger endpoint returns 200 | RED |
| TC-04 | frontend/packages/genvoice-web-sdk/test/client_test.ts | Client initialization | RED |
| TC-05 | frontend/packages/genvoice-web-sdk/test/types_test.ts | TypeScript compilation | RED |

---

## 9. Dependencies

### 9.1 External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| fastapi-swagger-ui | latest | Serve Swagger UI |
| typescript | ^5.0 | SDK types |

### 9.2 Internal Dependencies

| Component | Relationship |
|-----------|--------------|
| Phase 1 (F1.1) | Provides FastAPI base |
| Phase 1 (F1.3) | Auth middleware |

---

## 10. Acceptance Criteria

### 10.1 Success Conditions

- [ ] GET /docs returns 200 with Swagger UI
- [ ] GET /openapi.json returns valid OpenAPI 3.0 spec
- [ ] SDK package compiles without TypeScript errors
- [ ] All API errors use ErrorCode enum
- [ ] Integration guides render at /api-docs

### 10.2 Definition of Done Checklist

- [ ] Folder structure reviewed
- [ ] SPEC reviewed
- [ ] Test cases defined
- [ ] Implementation starts after approval

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-04-20 | AI Agent | Initial draft for Phase 6 Developer Tools |