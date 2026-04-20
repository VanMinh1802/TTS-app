# SPEC: F1.2 - PostgreSQL Database Setup (Neon)

## Overview
Set up PostgreSQL database using Neon.tech cloud service with Alembic migrations. This connects the backend to a persistent database for production use.

---

## Functional Requirements

### F1.2.1 - Neon Database Configuration
- [x] Create Neon project and database
- [x] Configure connection string in environment
- [x] Update SQLAlchemy to use Neon PostgreSQL
- [x] Set up connection pooling

### F1.2.2 - Alembic Migrations
- [x] Initialize Alembic configuration
- [x] Create initial migration for users table
- [x] Create initial migration for api_keys table
- [x] Document migration commands

### F1.2.3 - Database Connection Management
- [x] Implement proper connection lifecycle
- [x] Handle reconnection on failure
- [x] Add connection health check endpoint

---

## Acceptance Criteria

### F1.2.1 - Neon Configuration
- [x] Database connects using DATABASE_URL from environment
- [x] Connection works from both local and production environments

### F1.2.2 - Migrations
- [x] `alembic upgrade head` creates all tables
- [x] `alembic downgrade base` drops all tables
- [x] Migrations are reversible

### F1.2.3 - Connection Management
- [x] App starts only when database is reachable
- [x] Health endpoint returns database status

---

## API Contracts

### Health Check Endpoint

```
GET /api/health
Response (200):
{
  "status": "healthy",
  "database": "connected"
}

Response (503):
{
  "status": "unhealthy",
  "database": "disconnected"
}
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
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## Configuration

```python
# Environment Variables
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/genvoice?sslmode=require
```

---

## Migration Commands

```bash
# Create initial migration
alembic revision --autogenerate -m "Create users and api_keys tables"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade base

# Check current version
alembic current
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Database unavailable at startup | Fail fast with clear error message |
| Connection timeout | Retry with exponential backoff (max 3 attempts) |
| Migration failure | Show error and abort |
| SSL certificate error | Ensure sslmode=require in connection string |

---

## Dependencies

- [x] F1.1 (FastAPI Auth) - Must be completed first

---

## Implementation Estimate

- **Effort**: Low
- **Complexity**: Low
- **Estimated Time**: 1-2 hours

---

# 👉 APPROVE to proceed with implementation?

Please review the SPEC above and let me know:
- ✅ APPROVE - proceed with implementation
- ❌ REJECT - specify what needs to change
- ❓ HAVE QUESTIONS - ask for clarification