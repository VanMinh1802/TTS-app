"""Custom Dictionary API routes."""
from datetime import datetime
from typing import Optional
from uuid import uuid4

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

router = APIRouter(prefix="/dictionary", tags=["Dictionary"])

# In-memory storage for MVP (replace with DB in production)
DICTIONARY_STORE: dict[str, list[DictionaryEntry]] = {}


def get_user_dict(user_id: str) -> list[DictionaryEntry]:
    """Get dictionary for user."""
    return DICTIONARY_STORE.get(user_id, [])


def save_user_dict(user_id: str, entries: list[DictionaryEntry]):
    """Save dictionary for user."""
    DICTIONARY_STORE[user_id] = entries


@router.get("", response_model=DictionaryListResponse)
async def list_dictionary(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """List user's custom dictionary entries."""
    entries = get_user_dict(current_user.id)
    total = len(entries)
    
    start = (page - 1) * page_size
    end = start + page_size
    
    return DictionaryListResponse(
        entries=entries[start:end],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=DictionaryEntry, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: DictionaryCreate,
    current_user: User = Depends(get_current_user),
):
    """Add new dictionary entry."""
    entries = get_user_dict(current_user.id)
    
    # Check for duplicate word
    for e in entries:
        if e.word.lower() == entry.word.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Word '{entry.word}' already exists"
            )
    
    new_entry = DictionaryEntry(
        id=str(uuid4()),
        user_id=current_user.id,
        word=entry.word,
        pronunciation=entry.pronunciation,
        category=entry.category,
    )
    
    entries.append(new_entry)
    save_user_dict(current_user.id, entries)
    
    return new_entry


@router.put("/{entry_id}", response_model=DictionaryEntry)
async def update_entry(
    entry_id: str,
    update: DictionaryUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update dictionary entry."""
    entries = get_user_dict(current_user.id)
    
    for entry in entries:
        if entry.id == entry_id:
            if update.word is not None:
                entry.word = update.word
            if update.pronunciation is not None:
                entry.pronunciation = update.pronunciation
            if update.category is not None:
                entry.category = update.category
            entry.updated_at = datetime.utcnow()
            return entry
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Entry not found"
    )


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete dictionary entry."""
    entries = get_user_dict(current_user.id)
    
    for i, entry in enumerate(entries):
        if entry.id == entry_id:
            entries.pop(i)
            save_user_dict(current_user.id, entries)
            return
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Entry not found"
    )


@router.post("/import", response_model=DictionaryListResponse)
async def import_entries(
    import_request: DictionaryImportRequest,
    current_user: User = Depends(get_current_user),
):
    """Batch import entries."""
    entries = get_user_dict(current_user.id)
    existing_words = {e.word.lower() for e in entries}
    
    added = 0
    for new_entry in import_request.entries:
        if new_entry.word.lower() not in existing_words:
            entry = DictionaryEntry(
                id=str(uuid4()),
                user_id=current_user.id,
                word=new_entry.word,
                pronunciation=new_entry.pronunciation,
                category=new_entry.category,
            )
            entries.append(entry)
            added += 1
            existing_words.add(new_entry.word.lower())
    
    save_user_dict(current_user.id, entries)
    
    return DictionaryListResponse(
        entries=entries,
        total=len(entries),
        page=1,
        page_size=len(entries),
    )


@router.get("/export", response_model=DictionaryExport)
async def export_dictionary(
    current_user: User = Depends(get_current_user),
):
    """Export dictionary as JSON."""
    entries = get_user_dict(current_user.id)
    
    return DictionaryExport(
        entries=[e.model_dump() for e in entries],
        exported_at=datetime.utcnow(),
    )


@router.get("/search")
async def search_dictionary(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
):
    """Search dictionary."""
    entries = get_user_dict(current_user.id)
    q_lower = q.lower()
    
    results = [
        e for e in entries
        if q_lower in e.word.lower() or q_lower in e.pronunciation.lower()
    ]
    
    return {"results": results, "total": len(results)}