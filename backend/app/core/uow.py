"""Unit of Work — transaction context manager with repository access."""
from sqlalchemy.orm import Session

from app.repositories.user import UserRepository, APIKeyRepository
from app.repositories.quota import QuotaRepository, UsageHistoryRepository
from app.repositories.dictionary import DictionaryRepository
from app.repositories.audio_record import AudioRecordRepository
from app.repositories.license import LicenseKeyRepository
from app.repositories.analytics import RequestLogRepository, UsageSnapshotRepository


class UnitOfWork:
    """Transaction boundary with access to all repositories.

    Usage:
        with UnitOfWork(db) as uow:
            uow.users.get(user_id)
            uow.quotas.consume(...)
        # Auto-commits on success, rolls back on exception
    """

    def __init__(self, session: Session):
        self.session = session
        self.users: UserRepository = UserRepository(session)
        self.api_keys: APIKeyRepository = APIKeyRepository(session)
        self.quotas: QuotaRepository = QuotaRepository(session)
        self.usage_history: UsageHistoryRepository = UsageHistoryRepository(session)
        self.dictionaries: DictionaryRepository = DictionaryRepository(session)
        self.audio_records: AudioRecordRepository = AudioRecordRepository(session)
        self.licenses: LicenseKeyRepository = LicenseKeyRepository(session)
        self.request_logs: RequestLogRepository = RequestLogRepository(session)
        self.usage_snapshots: UsageSnapshotRepository = UsageSnapshotRepository(session)

    def __enter__(self) -> "UnitOfWork":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is not None:
            self.session.rollback()
        else:
            self.session.commit()

    def commit(self) -> None:
        self.session.commit()

    def flush(self) -> None:
        self.session.flush()

    def rollback(self) -> None:
        self.session.rollback()
