"""API Router for Audio Library."""
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status

from app.api.auth import get_current_user
from app.core.di import get_library_service, get_uow
from app.core.uow import UnitOfWork
from app.models.user import User
from app.schemas.library import AudioRecordResponse, LibraryListResponse
from app.services.library_service import LibraryService
from app.services.quota_service import QuotaService

router = APIRouter(prefix="/library", tags=["Library"])


@router.post("/upload", response_model=AudioRecordResponse)
async def upload_to_library(
    file: UploadFile,
    text_content: str = Form(...),
    voice_id: str = Form(...),
    user: User = Depends(get_current_user),
    service: LibraryService = Depends(get_library_service),
    uow: UnitOfWork = Depends(get_uow)
):
    """Upload an audio file to Cloudflare R2 and save metadata (PRO users only)."""
    # Check tier
    quota_service = QuotaService(uow)
    quota = quota_service.get_or_create_quota(user.id)
    if quota.tier != "pro" and quota.tier != "enterprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tính năng lưu trữ đám mây chỉ dành cho tài khoản PRO (Cloud storage requires PRO tier)."
        )
        
    file_bytes = await file.read()
    
    # Upload and save
    record = service.upload_to_cloud(
        user_id=user.id,
        file_bytes=file_bytes,
        text_content=text_content,
        voice_id=voice_id
    )
    return record


@router.get("", response_model=LibraryListResponse)
async def list_library_records(
    user: User = Depends(get_current_user),
    service: LibraryService = Depends(get_library_service)
):
    """List all saved audio records for the user."""
    records = service.list_user_records(user.id)
    return LibraryListResponse(items=records)


@router.delete("/{record_id}")
async def delete_library_record(
    record_id: str,
    user: User = Depends(get_current_user),
    service: LibraryService = Depends(get_library_service)
):
    """Delete an audio record from the library."""
    service.delete_record(user.id, record_id)
    return {"status": "success", "message": "Record deleted successfully"}
