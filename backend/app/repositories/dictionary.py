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
