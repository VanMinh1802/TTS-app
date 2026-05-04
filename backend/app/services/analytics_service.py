"""Analytics service for querying logs and usage data."""
from typing import List, Dict, Any
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import func, select

from app.core.uow import UnitOfWork
from app.models.analytics import RequestLog, UsageSnapshot


def normalize_request_metadata(request) -> dict:
    """Extract request metadata in one place."""
    user_id = None
    if hasattr(request.state, "user") and request.state.user:
        user_id = getattr(request.state.user, "id", None)

    client_ip = request.client.host if request.client else None
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()

    return {
        "user_id": user_id,
        "ip_address": client_ip,
        "user_agent": request.headers.get("User-Agent"),
    }


class AnalyticsService:
    """Service for analytics queries."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

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
        log = self.uow.request_logs.log_request(
            method=method,
            path=path,
            status_code=status_code,
            latency_ms=latency_ms,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.uow.commit()
        return log

    def get_total_requests(self) -> int:
        return self.uow.request_logs.session.execute(
            select(func.count(RequestLog.id))
        ).scalar() or 0

    def get_total_users(self) -> int:
        return self.uow.request_logs.session.execute(
            select(func.count(func.distinct(RequestLog.user_id)))
        ).scalar() or 0

    def get_average_latency(self) -> float:
        result = self.uow.request_logs.session.execute(
            select(func.avg(RequestLog.latency_ms))
        ).scalar()
        return round(float(result or 0), 2)

    def get_requests_today(self) -> int:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)
        return self.uow.request_logs.session.execute(
            select(func.count(RequestLog.id))
            .where(
                RequestLog.timestamp >= today_start,
                RequestLog.timestamp < tomorrow_start,
            )
        ).scalar() or 0

    def get_requests_by_endpoint(self, limit: int = 10) -> List[Dict[str, Any]]:
        results = (
            self.uow.request_logs.session.execute(
                select(
                    RequestLog.path,
                    func.count(RequestLog.id).label("count")
                )
                .group_by(RequestLog.path)
                .order_by(func.count(RequestLog.id).desc())
                .limit(limit)
            ).all()
        )
        return [{"path": r.path, "count": r.count} for r in results]

    def get_top_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        results = (
            self.uow.request_logs.session.execute(
                select(
                    RequestLog.user_id,
                    func.count(RequestLog.id).label("requests")
                )
                .where(RequestLog.user_id.isnot(None))
                .group_by(RequestLog.user_id)
                .order_by(func.count(RequestLog.id).desc())
                .limit(limit)
            ).all()
        )
        return [{"user_id": r.user_id, "requests": r.requests} for r in results]

    def update_usage(
        self,
        user_id: int,
        feature: str,
        characters_used: int = 0,
        api_calls: int = 0,
    ) -> UsageSnapshot:
        snapshot = self.uow.usage_snapshots.upsert_daily(
            user_id=user_id,
            feature=feature,
            characters=characters_used,
            api_calls=api_calls,
        )
        self.uow.commit()
        return snapshot
