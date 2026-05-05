"""Persistent dictionary service."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.core.exceptions import ConflictError, NotFoundError
from app.core.uow import UnitOfWork
from app.models.dictionary import DictionaryEntryModel
from app.schemas.dictionary import DictionaryCreate, DictionaryEntry, DictionaryUpdate


class DictionaryService:
    """Dictionary persistence and retrieval."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    @staticmethod
    def _to_schema(entry: DictionaryEntryModel) -> DictionaryEntry:
        return DictionaryEntry.model_validate(entry, from_attributes=True)

    def list_entries(self, user_id: str, offset: int = 0, limit: int = 20) -> tuple[list[DictionaryEntry], int]:
        total = self.uow.dictionaries.session.execute(
            select(func.count()).select_from(DictionaryEntryModel)
            .where(DictionaryEntryModel.user_id == user_id)
        ).scalar() or 0
        entries = self.uow.dictionaries.session.execute(
            select(DictionaryEntryModel)
            .where(DictionaryEntryModel.user_id == user_id)
            .order_by(DictionaryEntryModel.word.asc())
            .offset(offset).limit(limit)
        ).scalars().all()
        return [self._to_schema(e) for e in entries], total

    def create_entry(self, user_id: str, payload: DictionaryCreate) -> DictionaryEntry:
        existing = self.uow.dictionaries.find_by_user_and_word(user_id, payload.word)
        if existing:
            raise ConflictError(f"Word '{payload.word}' already exists")

        entry = DictionaryEntryModel(
            user_id=user_id,
            word=payload.word,
            pronunciation=payload.pronunciation,
            category=payload.category,
        )
        self.uow.dictionaries.create(entry)
        self.uow.commit()
        return self._to_schema(entry)

    def update_entry(self, user_id: str, entry_id: str, payload: DictionaryUpdate) -> DictionaryEntry:
        entry = self.uow.dictionaries.find_one(id=entry_id, user_id=user_id)
        if not entry:
            raise NotFoundError("Entry not found")
        if payload.word is not None:
            entry.word = payload.word
        if payload.pronunciation is not None:
            entry.pronunciation = payload.pronunciation
        if payload.category is not None:
            entry.category = payload.category
        entry.updated_at = datetime.now(timezone.utc)
        self.uow.commit()
        return self._to_schema(entry)

    def delete_entry(self, user_id: str, entry_id: str) -> None:
        entry = self.uow.dictionaries.find_one(id=entry_id, user_id=user_id)
        if not entry:
            raise NotFoundError("Entry not found")
        self.uow.dictionaries.delete(entry)
        self.uow.commit()

    def import_entries(self, user_id: str, payloads: list[DictionaryCreate]) -> tuple[list[DictionaryEntry], int]:
        existing_words = {e.word.lower(): e for e in self.uow.dictionaries.find_all(user_id=user_id)}
        for payload in payloads:
            key = payload.word.lower()
            if key in existing_words:
                continue
            entry = DictionaryEntryModel(
                user_id=user_id,
                word=payload.word,
                pronunciation=payload.pronunciation,
                category=payload.category,
            )
            self.uow.dictionaries.create(entry)
            existing_words[key] = entry
        self.uow.commit()
        entries = self.uow.dictionaries.find_all(user_id=user_id)
        total = len(entries)
        return [self._to_schema(e) for e in entries], total

    def export_entries(self, user_id: str) -> list[DictionaryEntry]:
        entries = self.uow.dictionaries.find_all(user_id=user_id)
        return [self._to_schema(e) for e in entries]

    def search_entries(self, user_id: str, query: str) -> list[DictionaryEntry]:
        return [self._to_schema(e) for e in self.uow.dictionaries.search(user_id, query)]
