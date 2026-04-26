"""Library service for managing audio records in DB and R2."""
import uuid
import logging
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audio_record import AudioRecord
from app.services.quota_service import QuotaService
from app.services.r2_service import r2_library_service

logger = logging.getLogger(__name__)


class LibraryService:
    """Service for managing the audio library."""

    def __init__(self, db: Session):
        self.db = db
        self.quota_service = QuotaService(db)

    def upload_to_cloud(self, user_id: str, file_bytes: bytes, text_content: str, voice_id: str) -> AudioRecord:
        """Upload audio to Cloudflare R2 and save to DB."""
        # 1. Check user tier is PRO (This should technically be handled by route, but we double check or assume it's checked)
        # We will handle tier check in the API router for better HTTP responses.
        
        # 2. Check storage quota
        file_size_bytes = len(file_bytes)
        # Convert bytes to MB for quota (quota limit is in MB).
        # We'll calculate mb and if it's < 1, we still want to track accurately if QuotaService allows it.
        # QuotaService tracks integer MBs. Let's do a ceil to 1MB if very small, or use precise if we update QuotaService.
        # For simplicity, 1MB = 1048576 bytes. We'll consume max(1, file_size_bytes // (1024 * 1024)).
        file_size_mb = max(1, file_size_bytes // (1024 * 1024))
        
        if not self.quota_service.check_quota(user_id, "storage", file_size_mb):
            raise HTTPException(status_code=429, detail="Bạn đã hết dung lượng lưu trữ Storage (Storage limit reached).")
            
        # 3. Upload to R2
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
            raise HTTPException(status_code=500, detail="Lỗi khi tải file lên máy chủ (R2 Upload Error).")
            
        public_url = r2_library_service.get_public_url(r2_key)
        
        # 4. Save to DB
        record = AudioRecord(
            id=record_id,
            user_id=user_id,
            voice_id=voice_id,
            text_content=text_content,
            file_url=public_url,
            file_size_bytes=file_size_bytes
        )
        self.db.add(record)
        
        # 5. Consume Quota
        self.quota_service.consume_quota(user_id, "storage", file_size_mb)
        
        self.db.commit()
        self.db.refresh(record)
        
        return record

    def list_user_records(self, user_id: str) -> Sequence[AudioRecord]:
        """List all audio records for a user."""
        return self.db.execute(
            select(AudioRecord)
            .where(AudioRecord.user_id == user_id)
            .order_by(AudioRecord.created_at.desc())
        ).scalars().all()

    def delete_record(self, user_id: str, record_id: str) -> bool:
        """Delete an audio record from DB and R2."""
        record = self.db.execute(
            select(AudioRecord)
            .where(AudioRecord.id == record_id, AudioRecord.user_id == user_id)
        ).scalar_one_or_none()
        
        if not record:
            raise HTTPException(status_code=404, detail="Không tìm thấy file âm thanh (Record not found).")
            
        # Delete from R2
        r2_key = f"audio/{user_id}/{record_id}.wav"
        try:
            r2_library_service.delete_file(r2_key)
        except Exception as e:
            logger.error(f"Failed to delete from R2: {e}")
            # Continue to delete from DB anyway so user isn't stuck
            
        # Refund quota
        file_size_mb = max(1, record.file_size_bytes // (1024 * 1024))
        # Consume negative amount
        self.quota_service.consume_quota(user_id, "storage", -file_size_mb)
        
        self.db.delete(record)
        self.db.commit()
        return True
