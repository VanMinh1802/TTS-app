"""Persistent dictionary service."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.core.exceptions import ConflictError, NotFoundError
from app.models.dictionary import DictionaryEntryModel
from app.repositories.dictionary import DictionaryRepository
from app.schemas.dictionary import DictionaryCreate, DictionaryEntry, DictionaryUpdate


class DictionaryService:
    """Dictionary persistence and retrieval."""

    def __init__(self, repo: DictionaryRepository):
        self.repo = repo
        self.db = repo.session

    @staticmethod
    def _to_schema(entry: DictionaryEntryModel) -> DictionaryEntry:
        return DictionaryEntry.model_validate(entry, from_attributes=True)

    def list_entries(self, user_id: str) -> tuple[list[DictionaryEntry], int]:
        entries = self.db.execute(
            select(DictionaryEntryModel)
            .where(DictionaryEntryModel.user_id == user_id)
            .order_by(DictionaryEntryModel.priority.desc(), DictionaryEntryModel.word.asc())
        ).scalars().all()
        return [self._to_schema(entry) for entry in entries], len(entries)

    def create_entry(self, user_id: str, payload: DictionaryCreate) -> DictionaryEntry:
        existing = self.db.execute(
            select(DictionaryEntryModel).where(
                DictionaryEntryModel.user_id == user_id,
                func.lower(DictionaryEntryModel.word) == payload.word.lower(),
            )
        ).scalar_one_or_none()
        if existing:
            raise ConflictError(f"Word '{payload.word}' already exists")

        entry = DictionaryEntryModel(
            user_id=user_id,
            word=payload.word,
            pronunciation=payload.pronunciation,
            priority=payload.priority,
            category=payload.category,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return self._to_schema(entry)

    def update_entry(self, user_id: str, entry_id: str, payload: DictionaryUpdate) -> DictionaryEntry:
        entry = self._get_entry(user_id, entry_id)
        if payload.word is not None:
            entry.word = payload.word
        if payload.pronunciation is not None:
            entry.pronunciation = payload.pronunciation
        if payload.priority is not None:
            entry.priority = payload.priority
        if payload.category is not None:
            entry.category = payload.category
        entry.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(entry)
        return self._to_schema(entry)

    def delete_entry(self, user_id: str, entry_id: str) -> None:
        entry = self._get_entry(user_id, entry_id)
        self.db.delete(entry)
        self.db.commit()

    def import_entries(self, user_id: str, payloads: list[DictionaryCreate]) -> tuple[list[DictionaryEntry], int]:
        existing_words = set(self._entry_map(user_id).keys())

        for payload in payloads:
            key = payload.word.lower()
            if key in existing_words:
                continue
            entry = DictionaryEntryModel(
                user_id=user_id,
                word=payload.word,
                pronunciation=payload.pronunciation,
                priority=payload.priority,
                category=payload.category,
            )
            self.db.add(entry)
            existing_words.add(key)

        self.db.commit()
        entries, total = self.list_entries(user_id)
        return entries, total

    def export_entries(self, user_id: str) -> list[DictionaryEntry]:
        entries, _ = self.list_entries(user_id)
        return entries

    def search_entries(self, user_id: str, query: str) -> list[DictionaryEntry]:
        lowered = query.lower()
        entries, _ = self.list_entries(user_id)
        return [
            entry
            for entry in entries
            if lowered in entry.word.lower() or lowered in entry.pronunciation.lower()
        ]

    def _get_entry(self, user_id: str, entry_id: str) -> DictionaryEntryModel:
        entry = self.db.execute(
            select(DictionaryEntryModel).where(
                DictionaryEntryModel.id == entry_id,
                DictionaryEntryModel.user_id == user_id,
            )
        ).scalar_one_or_none()
        if not entry:
            raise NotFoundError("Entry not found")
        return entry

    def _entry_map(self, user_id: str) -> dict[str, DictionaryEntryModel]:
        entries = self.db.execute(
            select(DictionaryEntryModel).where(DictionaryEntryModel.user_id == user_id)
        ).scalars().all()
        return {entry.word.lower(): entry for entry in entries}
