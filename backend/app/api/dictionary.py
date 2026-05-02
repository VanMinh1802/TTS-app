"""Custom Dictionary API routes."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.dictionary import (
    DictionaryCreate,
    DictionaryExport,
    DictionaryEntry,
    DictionaryImportRequest,
    DictionaryListResponse,
    DictionaryUpdate,
)
from app.core.exceptions import ConflictError, NotFoundError
from app.services.dictionary_service import DictionaryService

router = APIRouter(prefix="/dictionary", tags=["Dictionary"])


def get_dictionary_service(db: Session = Depends(get_db)) -> DictionaryService:
    return DictionaryService(db)


@router.get("", response_model=DictionaryListResponse)
async def list_dictionary(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    entries, total = service.list_entries(current_user.id)
    start = (page - 1) * page_size
    end = start + page_size
    return DictionaryListResponse(entries=entries[start:end], total=total, page=page, page_size=page_size)


@router.post("", response_model=DictionaryEntry, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: DictionaryCreate,
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    try:
        return service.create_entry(current_user.id, entry)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc


@router.put("/{entry_id}", response_model=DictionaryEntry)
async def update_entry(
    entry_id: str,
    update: DictionaryUpdate,
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    try:
        return service.update_entry(current_user.id, entry_id, update)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    try:
        service.delete_entry(current_user.id, entry_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/import", response_model=DictionaryListResponse)
async def import_entries(
    import_request: DictionaryImportRequest,
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    entries, total = service.import_entries(current_user.id, import_request.entries)
    return DictionaryListResponse(entries=entries, total=total, page=1, page_size=len(entries))


@router.get("/export", response_model=DictionaryExport)
async def export_dictionary(
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    return DictionaryExport(entries=service.export_entries(current_user.id), exported_at=datetime.now(timezone.utc))


@router.get("/search")
async def search_dictionary(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    service: DictionaryService = Depends(get_dictionary_service),
):
    results = service.search_entries(current_user.id, q)
    return {"results": results, "total": len(results)}
