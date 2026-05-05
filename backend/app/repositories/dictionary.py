"""Pronunciation dictionary repository."""
from typing import Optional
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.dictionary import DictionaryEntryModel


class DictionaryRepository(BaseRepository[DictionaryEntryModel]):
    def __init__(self, session):
        super().__init__(DictionaryEntryModel, session)

    def search(self, user_id: str, query: str) -> list[DictionaryEntryModel]:
        return self.session.execute(
            select(self.model)
            .where(
                self.model.user_id == user_id,
                self.model.word.ilike(f"%{query}%")
            )
            .order_by(self.model.word)
        ).scalars().all()

    def find_by_user_and_word(self, user_id: str, word: str) -> Optional[DictionaryEntryModel]:
        return self.find_one(user_id=user_id, word=word)

    def bulk_upsert(self, user_id: str, entries: list[dict]) -> int:
        if not entries:
            return 0
        for entry in entries:
            entry.setdefault("user_id", user_id)
            existing = self.find_by_user_and_word(user_id, entry["word"])
            if existing:
                existing.pronunciation = entry.get("pronunciation", existing.pronunciation)
            else:
                self.create(DictionaryEntryModel(
                    user_id=user_id,
                    word=entry["word"],
                    pronunciation=entry.get("pronunciation", ""),
                    category=entry.get("category"),
                ))
        self.session.flush()
        return len(entries)
