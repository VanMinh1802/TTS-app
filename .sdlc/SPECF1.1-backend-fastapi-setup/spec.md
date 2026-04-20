# SPEC: F1.1 - FastAPI Project Setup with Auth Module

## Overview
Set up the backend infrastructure with FastAPI, including project structure, configuration, and basic authentication module. This is the foundation for all subsequent backend features.

---

## Functional Requirements

### F1.1.1 - Project Structure Setup
- [x] Create FastAPI project with proper directory structure
- [x] Set up configuration management (environment-based)
- [x] Configure logging and error handling
- [x] Set up CORS, security headers

### F1.1.2 - Database Setup  
- [x] Configure SQLAlchemy connection to PostgreSQL (Neon)
- [x] Create base database models
- [x] Set up database migrations (Alembic)
- [x] Create user table schema

### F1.1.3 - Authentication Module
- [x] Implement JWT token generation
- [x] Implement password hashing (bcrypt)
- [x] Implement token validation middleware
- [x] Create login/logout endpoints

### F1.1.4 - API Key Module
- [x] Create API key table schema
- [x] Implement API key generation
- [x] Implement API key validation

---

## Acceptance Criteria

### F1.1.1 - Project Structure
- [x] FastAPI app runs without errors on `uvicorn`
- [x] Configuration loads from environment variables
- [x] Logging outputs to console/file
- [x] CORS configured for allowed origins

### F1.1.2 - Database
- [x] Database connection established
- [x] User table created with migration
- [x] Can perform CRUD operations on users table

### F1.1.3 - Authentication
- [x] `POST /api/auth/register` creates user with hashed password
- [x] `POST /api/auth/login` returns JWT token
- [x] `GET /api/auth/me` returns current user (with valid token)
- [x] Token expires after configured time

### F1.1.4 - API Keys
- [x] `POST /api/auth/keys` creates new API key
- [x] `GET /api/auth/keys` lists user's API keys
- [x] `DELETE /api/auth/keys/{key_id}` revokes API key

---

## API Contracts

### Authentication Endpoints

```
POST /api/auth/register
Request:
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
Response (201):
{
  "id": "uuid",
  "email": "user@example.com", 
  "name": "John Doe",
  "created_at": "2026-04-19T12:00:00Z"
}

POST /api/auth/login
Request:
{
  "email": "user@example.com", 
  "password": "securepassword123"
}
Response (200):
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response (200):
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}

POST /api/auth/keys
Headers: Authorization: Bearer <token>
Request:
{
  "name": "My API Key",
  "rate_limit": 100
}
Response (201):
{
  "id": "uuid",
  "key": "gva_xxxxx...",  // Full key shown once
  "name": "My API Key",
  "rate_limit": 100,
  "created_at": "2026-04-19T12:00:00Z"
}

GET /api/auth/keys
Headers: Authorization: Bearer <token>
Response (200):
{
  "keys": [
    {
      "id": "uuid",
      "name": "My API Key", 
      "rate_limit": 100,
      "created_at": "2026-04-19T12:00:00Z"
    }
  ]
}

DELETE /api/auth/keys/{key_id}
Headers: Authorization: Bearer <token>
Response (204): No content
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### API Keys Table

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Duplicate email registration | Return 409 Conflict |
| Invalid credentials on login | Return 401 Unauthorized |
| Expired token | Return 401 with "token expired" message |
| Invalid API key | Return 403 Forbidden |
| Rate limit exceeded | Return 429 Too Many Requests |
| Database connection failure | Return 503 Service Unavailable |

---

## Test Strategy

### Unit Tests
- [x] Test password hashing and verification
- [x] Test JWT token generation and validation
- [x] Test API key generation (hash not shown)

### Integration Tests  
- [x] Test user registration flow
- [x] Test login and token retrieval
- [x] Test authenticated request with token
- [x] Test API key creation and listing

### Test Coverage Target
- Minimum 80% code coverage (9 tests passing)

---

## Dependencies

- [x] F1.1 - COMPLETED ✅
- [ ] F1.2 (PostgreSQL Database) - In Progress

---

## Configuration

```python
# config.py
class Settings:
    # Database
    DATABASE_URL: str = "postgresql://..."
    
    # Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    
    # API
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "GenVoice API"
    CORS_ORIGINS: list = ["http://localhost:3000"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
```

---

## Questions for Clarification

1. **Database**: Should we use Neon (cloud PostgreSQL) or local PostgreSQL for development?

2. **Auth Providers**: Besides email/password, should we also support OAuth (Google/github) now or later?

3. **API Key Strategy**: Should API keys be tied to users with rate limiting, or should they be standalone (developer-focused)?

4. **Token Expiration**: Should we also provide refresh tokens, or is short-lived access token sufficient?

---

## Implementation Estimate

- **Effort**: Medium
- **Complexity**: Low-Medium  
- **Estimated Time**: 2-4 hours

---

# 👉 APPROVE to proceed with implementation?

Please review the SPEC above and let me know:
- ✅ APPROVE - proceed with implementation
- ❌ REJECT - specify what needs to change
- ❓ HAVE QUESTIONS - ask for clarification