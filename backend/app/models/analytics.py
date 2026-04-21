"""Analytics models for request logging and usage tracking."""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Index
from app.models import Base


class RequestLog(Base):
    """Model for API request logs."""
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    method = Column(String(10), nullable=False)
    path = Column(String(255), nullable=False, index=True)
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)


class UsageSnapshot(Base):
    """Model for daily usage aggregation per user/feature."""
    __tablename__ = "usage_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    feature = Column(String(50), nullable=False)
    date = Column(Date, default=date.today, index=True)
    characters_used = Column(Integer, default=0)
    api_calls = Column(Integer, default=0)

    __table_args__ = (
        Index("ix_usage_snapshot_user_feature_date", "user_id", "feature", "date", unique=True),
    )