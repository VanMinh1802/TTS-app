"""Analytics service for querying logs and usage data."""
from typing import List, Dict, Any
from datetime import date
from sqlalchemy import func
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
        return self.db.query(func.count(RequestLog.id)).scalar() or 0

    def get_total_users(self) -> int:
        """Get total unique users who made requests."""
        return self.db.query(func.count(func.distinct(RequestLog.user_id))).scalar() or 0

    def get_average_latency(self) -> float:
        """Get average latency in ms."""
        result = self.db.query(func.avg(RequestLog.latency_ms)).scalar()
        return round(float(result or 0), 2)

    def get_requests_today(self) -> int:
        """Get request count for today."""
        today = date.today()
        return self.db.query(func.count(RequestLog.id)).filter(
            func.date(RequestLog.timestamp) == today
        ).scalar() or 0

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