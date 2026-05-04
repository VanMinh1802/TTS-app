"""Audio record repository."""
from app.repositories.base import BaseRepository
from app.models.audio_record import AudioRecord


class AudioRecordRepository(BaseRepository[AudioRecord]):
    def __init__(self, session):
        super().__init__(AudioRecord, session)

    def get_by_user(self, user_id: str, page: int = 1, per_page: int = 50) -> tuple[list[AudioRecord], int]:
        return self.paginate(page=page, per_page=per_page, user_id=user_id, order_by=AudioRecord.created_at.desc())

    def get_user_record(self, record_id: str, user_id: str):
        return self.find_one(id=record_id, user_id=user_id)

    def count_by_user(self, user_id: str) -> int:
        return len(self.find_all(user_id=user_id))
