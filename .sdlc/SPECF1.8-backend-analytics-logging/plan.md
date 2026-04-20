# F1.8 - Basic Analytics Logging Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement task-by-task.

**Goal:** Implement analytics logging system to track API requests, responses, and usage statistics.

**Architecture:** Middleware-based logging + PostgreSQL storage + Admin API endpoint

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, Alembic

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/models/analytics.py` | Create | ORM models for request_logs and usage_snapshots |
| `app/services/analytics_service.py` | Create | Service for analytics queries |
| `app/api/analytics.py` | Create | Admin API endpoints |
| `app/middleware/logging.py` | Create | Request/response logging middleware |
| `app/main.py` | Modify | Add middleware to app |
| `alembic/versions/` | Create | Migration for analytics tables |
| `tests/test_analytics.py` | Create | Unit and integration tests |

---

## Implementation Steps

### Task 1: Create Analytics Models

**Files:** `app/models/analytics.py`

```python
"""Analytics models for request logging and usage tracking."""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db import Base


class RequestLog(Base):
    """Model for API request logs."""
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    method = Column(String(10), nullable=False)
    path = Column(String(255), nullable=False, index=True)
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)


class UsageSnapshot(Base):
    """Model for daily usage aggregation per user/feature."""
    __tablename__ = "usage_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    feature = Column(String(50), nullable=False)
    date = Column(Date, default=date.today, index=True)
    characters_used = Column(Integer, default=0)
    api_calls = Column(Integer, default=0)

    __table_args__ = (
        Index("ix_usage_snapshot_user_feature_date", "user_id", "feature", "date", unique=True),
    )
```

---

### Task 2: Create Analytics Service

**Files:** `app/services/analytics_service.py`

```python
"""Analytics service for querying logs and usage data."""
from typing import List, Dict, Any
from datetime import datetime, date
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.analytics import RequestLog, UsageSnapshot


class AnalyticsService:
    """Service for analytics queries."""

    def __init__(self, db: Session):
        self.db = db

    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        latency_ms: int,
        user_id: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> RequestLog:
        """Log an API request."""
        log = RequestLog(
            method=method,
            path=path,
            status_code=status_code,
            latency_ms=latency_ms,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent[:512] if user_agent else None,
        )
        self.db.add(log)
        self.db.commit()
        return log

    def get_total_requests(self) -> int:
        """Get total request count."""
        return self.db.query(func.count(RequestLog.id)).scalar()

    def get_total_users(self) -> int:
        """Get total unique users who made requests."""
        return self.db.query(func.count(func.distinct(RequestLog.user_id))).scalar()

    def get_average_latency(self) -> float:
        """Get average latency in ms."""
        result = self.db.query(func.avg(RequestLog.latency_ms)).scalar()
        return round(float(result or 0), 2)

    def get_requests_today(self) -> int:
        """Get request count for today."""
        today = date.today()
        return self.db.query(func.count(RequestLog.id)).filter(
            func.date(RequestLog.timestamp) == today
        ).scalar()

    def get_requests_by_endpoint(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get request counts grouped by endpoint."""
        results = (
            self.db.query(
                RequestLog.path,
                func.count(RequestLog.id).label("count")
            )
            .group_by(RequestLog.path)
            .order_by(func.count(RequestLog.id).desc())
            .limit(limit)
            .all()
        )
        return [{"path": r.path, "count": r.count} for r in results]

    def get_top_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top users by request count."""
        results = (
            self.db.query(
                RequestLog.user_id,
                func.count(RequestLog.id).label("requests")
            )
            .filter(RequestLog.user_id.isnot(None))
            .group_by(RequestLog.user_id)
            .order_by(func.count(RequestLog.id).desc())
            .limit(limit)
            .all()
        )
        return [{"user_id": r.user_id, "requests": r.requests} for r in results]

    def update_usage(
        self,
        user_id: int,
        feature: str,
        characters_used: int = 0,
        api_calls: int = 0,
    ) -> UsageSnapshot:
        """Update daily usage for a user/feature."""
        today = date.today()
        
        # Try to find existing record
        snapshot = (
            self.db.query(UsageSnapshot)
            .filter(
                UsageSnapshot.user_id == user_id,
                UsageSnapshot.feature == feature,
                UsageSnapshot.date == today,
            )
            .first()
        )
        
        if snapshot:
            snapshot.characters_used += characters_used
            snapshot.api_calls += api_calls
        else:
            snapshot = UsageSnapshot(
                user_id=user_id,
                feature=feature,
                date=today,
                characters_used=characters_used,
                api_calls=api_calls,
            )
            self.db.add(snapshot)
        
        self.db.commit()
        return snapshot
```

---

### Task 3: Create Logging Middleware

**Files:** `app/middleware/logging.py`

```python
"""Request logging middleware."""
import time
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.db import get_db
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip non-API routes
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        # Start timing
        start_time = time.time()
        
        # Get user ID if authenticated
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = getattr(request.state.user, "id", None)
        
        # Get client IP
        client_ip = request.client.host if request.client else None
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        
        # Process request
        response = await call_next(request)
        
        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Log to database (non-blocking, best effort)
        try:
            db = next(get_db())
            service = AnalyticsService(db)
            service.log_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                latency_ms=latency_ms,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=request.headers.get("User-Agent"),
            )
        except Exception as e:
            logger.warning(f"Failed to log request: {e}")
        
        return response
```

---

### Task 4: Create Admin Analytics API

**Files:** `app/api/analytics.py`

```python
"""Analytics API endpoints for admin."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.analytics_service import AnalyticsService
from app.api.auth import get_current_user
from app.models.user import User


router = APIRouter(prefix="/admin/analytics", tags=["Analytics"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("")
async def get_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    """Get analytics summary for admin dashboard."""
    service = AnalyticsService(db)
    
    return {
        "total_requests": service.get_total_requests(),
        "total_users": service.get_total_users() or 0,
        "average_latency_ms": service.get_average_latency(),
        "requests_today": service.get_requests_today(),
        "requests_by_endpoint": service.get_requests_by_endpoint(),
        "top_users": service.get_top_users(),
    }
```

---

### Task 5: Update Main App

**Files:** `app/main.py` - Add middleware

```python
from app.middleware.logging import LoggingMiddleware

# Add middleware (after CORS)
app.add_middleware(LoggingMiddleware)
```

---

### Task 6: Create Database Migration

**Files:** `alembic/versions/20260420_analytics.py`

```python
"""Add analytics tables.

Revision ID: analytics_001
Revises: 
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa


revision = 'analytics_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Request logs table
    op.create_table(
        'request_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('method', sa.String(10), nullable=False),
        sa.Column('path', sa.String(255), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(512), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_request_logs_id', 'request_logs', ['id'])
    op.create_index('ix_request_logs_timestamp', 'request_logs', ['timestamp'])
    op.create_index('ix_request_logs_user_id', 'request_logs', ['user_id'])
    op.create_index('ix_request_logs_path', 'request_logs', ['path'])
    
    # Usage snapshots table
    op.create_table(
        'usage_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('feature', sa.String(50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('characters_used', sa.Integer(), server_default='0'),
        sa.Column('api_calls', sa.Integer(), server_default='0'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_usage_snapshots_id', 'usage_snapshots', ['id'])
    op.create_index('ix_usage_snapshots_user_id', 'usage_snapshots', ['user_id'])
    op.create_index('ix_usage_snapshots_date', 'usage_snapshots', ['date'])
    op.create_index(
        'ix_usage_snapshot_user_feature_date', 
        'usage_snapshots', 
        ['user_id', 'feature', 'date'], 
        unique=True
    )


def downgrade() -> None:
    op.drop_table('usage_snapshots')
    op.drop_table('request_logs')
```

---

### Task 7: Write Tests

**Files:** `tests/test_analytics.py`

```python
"""Tests for analytics functionality."""
import pytest
from unittest.mock import MagicMock, patch
from datetime import date

from app.models.analytics import RequestLog, UsageSnapshot
from app.services.analytics_service import AnalyticsService


class TestAnalyticsService:
    """Test analytics service."""

    def test_log_request(self):
        """Test request logging."""
        mock_db = MagicMock()
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        
        service = AnalyticsService(mock_db)
        result = service.log_request(
            method="POST",
            path="/api/v1/tts/generate",
            status_code=200,
            latency_ms=150,
            user_id=1,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
        )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result.method == "POST"
        assert result.status_code == 200

    def test_get_total_requests(self):
        """Test getting total request count."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.func.count.return_value = mock_query
        mock_query.scalar.return_value = 150
        
        service = AnalyticsService(mock_db)
        result = service.get_total_requests()
        
        assert result == 150

    def test_update_usage_new(self):
        """Test creating new usage snapshot."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        
        service = AnalyticsService(mock_db)
        service.update_usage(user_id=1, feature="tts", characters_used=100)
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
```

---

## Acceptance Criteria Checklist

- [ ] Middleware logs all `/api/*` requests
- [ ] Logs stored in database with correct schema
- [ ] Admin can query: total requests, avg latency, requests by endpoint, top users
- [ ] Middleware doesn't block request processing (non-blocking)
- [ ] Graceful fallback when DB unavailable
- [ ] Tests pass

---

## Next Steps

After implementation:
1. Run migration: `alembic upgrade head`
2. Test endpoints manually
3. Verify logs are being created