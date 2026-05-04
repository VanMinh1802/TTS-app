"""Analytics repository for request logging and usage snapshots."""
from datetime import datetime, date
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.analytics import RequestLog, UsageSnapshot


class RequestLogRepository(BaseRepository[RequestLog]):
    def __init__(self, session):
        super().__init__(RequestLog, session)

    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        latency_ms: int,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> RequestLog:
        log = RequestLog(
            method=method,
            path=path,
            status_code=status_code,
            latency_ms=latency_ms,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow(),
        )
        return self.create(log)


class UsageSnapshotRepository(BaseRepository[UsageSnapshot]):
    def __init__(self, session):
        super().__init__(UsageSnapshot, session)

    def get_by_user_and_date(self, user_id: str, target_date: date) -> list[UsageSnapshot]:
        return self.session.execute(
            select(UsageSnapshot).where(
                UsageSnapshot.user_id == user_id,
                UsageSnapshot.date == target_date,
            )
        ).scalars().all()

    def upsert_daily(self, user_id: str, feature: str, characters: int, api_calls: int) -> UsageSnapshot:
        today = date.today()
        existing = self.session.execute(
            select(UsageSnapshot).where(
                UsageSnapshot.user_id == user_id,
                UsageSnapshot.feature == feature,
                UsageSnapshot.date == today,
            )
        ).scalar_one_or_none()
        if existing:
            existing.characters_used += characters
            existing.api_calls += api_calls
            return existing
        return self.create(UsageSnapshot(
            user_id=user_id,
            feature=feature,
            date=today,
            characters_used=characters,
            api_calls=api_calls,
        ))
