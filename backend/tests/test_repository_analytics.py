"""Tests for analytics repositories."""
from app.models.analytics import RequestLog, UsageSnapshot
from app.repositories.analytics import RequestLogRepository, UsageSnapshotRepository

def test_log_request(db_session):
    repo = RequestLogRepository(db_session)
    log = repo.log_request(method="GET", path="/api/tts", status_code=200, latency_ms=50, user_id="u1")
    assert log.id is not None
    assert log.method == "GET"

def test_upsert_snapshot(db_session):
    repo = UsageSnapshotRepository(db_session)
    snap = repo.upsert_daily("u1", "tts", characters=500, api_calls=3)
    assert snap.characters_used == 500
    snap2 = repo.upsert_daily("u1", "tts", characters=200, api_calls=1)
    assert snap2.characters_used == 700
