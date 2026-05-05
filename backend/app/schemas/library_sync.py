from datetime import datetime
from pydantic import BaseModel


class SyncRecordItem(BaseModel):
    id: str
    text_content: str
    voice_id: str
    audio_data: str
    file_size_bytes: int
    duration: float | None = None


class SyncRequest(BaseModel):
    records: list[SyncRecordItem]


class SyncResultItem(BaseModel):
    id: str
    file_url: str
    synced_at: datetime


class SyncFailedItem(BaseModel):
    id: str
    error: str


class SyncResponse(BaseModel):
    synced: list[SyncResultItem]
    failed: list[SyncFailedItem]
