"""Library service for managing audio records in DB and R2."""
import base64
import io as _io
import uuid
import logging
from typing import Any, Sequence

from pydub import AudioSegment

from app.core.uow import UnitOfWork
from app.core.exceptions import NotFoundError, QuotaExceededError, StorageError
from app.models.audio_record import AudioRecord
from app.services.quota_service import QuotaService
from app.services.r2_service import r2_library_service

logger = logging.getLogger(__name__)


class LibraryService:
    """Service for managing the audio library."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow
        self.quota_service = QuotaService(uow)

    def upload_to_cloud(self, user_id: str, file_bytes: bytes, text_content: str, voice_id: str, duration: float | None = None) -> AudioRecord:
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
            file_size_bytes=file_size_bytes,
            duration=duration
        )
        self.uow.audio_records.create(record)

        self.quota_service.consume_quota(user_id, "storage", file_size_mb)

        self.uow.commit()

        return record

    def batch_sync(self, user_id: str, records: list[dict[str, Any]]) -> dict[str, list]:
        from datetime import datetime

        synced = []
        failed = []

        for rec in records:
            try:
                use_mp3 = False
                raw = rec.get("audio_mp3")
                if raw and raw.strip():
                    use_mp3 = True
                else:
                    raw = rec.get("audio_data", "")

                if raw.startswith("data:"):
                    raw = raw.split(",", 1)[1]

                try:
                    file_bytes = base64.b64decode(raw)
                except Exception:
                    if use_mp3:
                        raw = rec.get("audio_data", "")
                        if raw.startswith("data:"):
                            raw = raw.split(",", 1)[1]
                        file_bytes = base64.b64decode(raw)
                        use_mp3 = False
                    else:
                        raise

                if not use_mp3:
                    try:
                        audio = AudioSegment.from_file(_io.BytesIO(file_bytes), format="wav")
                        mp3_buf = _io.BytesIO()
                        audio.export(mp3_buf, format="mp3", bitrate="128k")
                        file_bytes = mp3_buf.getvalue()
                        use_mp3 = True
                    except Exception as conv_err:
                        logger.warning(f"WAV->MP3 conversion failed for {rec.get('id')}: {conv_err}")

                file_size_mb = max(1, len(file_bytes) // (1024 * 1024))

                if not self.quota_service.check_quota(user_id, "storage", file_size_mb):
                    failed.append({"id": rec["id"], "error": "Storage quota exceeded"})
                    continue

                record_id = rec["id"]
                ext = "mp3" if use_mp3 else "wav"
                content_type = "audio/mpeg" if use_mp3 else "audio/wav"
                r2_key = f"audio/{user_id}/{record_id}.{ext}"

                r2_library_service.upload_file(
                    file_bytes=file_bytes,
                    object_name=r2_key,
                    content_type=content_type,
                )

                public_url = r2_library_service.get_public_url(r2_key)

                record = AudioRecord(
                    id=record_id,
                    user_id=user_id,
                    voice_id=rec["voice_id"],
                    text_content=rec["text_content"],
                    file_url=public_url,
                    file_size_bytes=rec.get("file_size_bytes", len(file_bytes)),
                    duration=rec.get("duration"),
                )
                self.uow.session.merge(record)
                self.quota_service.consume_quota(user_id, "storage", file_size_mb)
                self.uow.flush()

                synced.append({"id": record_id, "file_url": public_url, "synced_at": datetime.utcnow()})

            except Exception as e:
                logger.error(f"Sync failed for {rec.get('id')}: {e}")
                self.uow.rollback()
                failed.append({"id": rec.get("id", "unknown"), "error": str(e)})

        try:
            self.uow.commit()
        except Exception:
            self.uow.rollback()
        return {"synced": synced, "failed": failed}

    def list_user_records(self, user_id: str, page: int = 1, per_page: int = 50) -> tuple[Sequence[AudioRecord], int]:
        records, total = self.uow.audio_records.get_by_user(user_id, page=page, per_page=per_page)
        return records, total

    def delete_record(self, user_id: str, record_id: str) -> bool:
        record = self.uow.audio_records.get_user_record(record_id, user_id)

        if not record:
            raise NotFoundError("Không tìm thấy file âm thanh (Record not found).")

        # Derive R2 key from stored URL to handle both .wav and .mp3
        if record.file_url:
            # Extract the path portion: "audio/{user_id}/{record_id}.{ext}"
            url_path = record.file_url.rsplit("/", 2)
            if len(url_path) >= 2:
                r2_key = "/".join(url_path[-2:])  # "audio/user_id/record_id.ext"
            else:
                r2_key = f"audio/{user_id}/{record_id}.wav"
        else:
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
