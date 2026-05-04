"""Library service for managing audio records in DB and R2."""
import uuid
import logging
from typing import Sequence
from sqlalchemy import select

from app.core.uow import UnitOfWork
from app.core.exceptions import NotFoundError, InvalidInputError, PermissionDeniedError, QuotaExceededError, StorageError
from app.models.audio_record import AudioRecord
from app.services.quota_service import QuotaService
from app.services.r2_service import r2_library_service

logger = logging.getLogger(__name__)


class LibraryService:
    """Service for managing the audio library."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow
        self.quota_service = QuotaService(uow)

    def upload_to_cloud(self, user_id: str, file_bytes: bytes, text_content: str, voice_id: str) -> AudioRecord:
        """Upload audio to Cloudflare R2 and save to DB."""
        file_size_bytes = len(file_bytes)
        file_size_mb = max(1, file_size_bytes // (1024 * 1024))

        if not self.quota_service.check_quota(user_id, "storage", file_size_mb):
            raise QuotaExceededError("Bạn đã hết dung lượng lưu trữ Storage (Storage limit reached).")

        record_id = str(uuid.uuid4())
        r2_key = f"audio/{user_id}/{record_id}.wav"

        try:
            r2_library_service.upload_file(
                file_bytes=file_bytes,
                object_name=r2_key,
                content_type="audio/wav"
            )
        except Exception as e:
            logger.error(f"Failed to upload to R2: {e}")
            raise StorageError("Lỗi khi tải file lên máy chủ (R2 Upload Error).")

        public_url = r2_library_service.get_public_url(r2_key)

        record = AudioRecord(
            id=record_id,
            user_id=user_id,
            voice_id=voice_id,
            text_content=text_content,
            file_url=public_url,
            file_size_bytes=file_size_bytes
        )
        self.uow.audio_records.create(record)

        self.quota_service.consume_quota(user_id, "storage", file_size_mb)

        self.uow.commit()

        return record

    def list_user_records(self, user_id: str) -> Sequence[AudioRecord]:
        records = self.uow.audio_records.find_all(user_id=user_id)
        return sorted(records, key=lambda r: r.created_at, reverse=True)

    def delete_record(self, user_id: str, record_id: str) -> bool:
        record = self.uow.audio_records.get_user_record(record_id, user_id)

        if not record:
            raise NotFoundError("Không tìm thấy file âm thanh (Record not found).")

        r2_key = f"audio/{user_id}/{record_id}.wav"
        try:
            r2_library_service.delete_file(r2_key)
        except Exception as e:
            logger.error(f"Failed to delete from R2: {e}")

        file_size_mb = max(1, record.file_size_bytes // (1024 * 1024))
        self.quota_service.consume_quota(user_id, "storage", -file_size_mb)

        self.uow.audio_records.delete(record)
        self.uow.commit()
        return True
