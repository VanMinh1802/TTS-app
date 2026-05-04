"""User emotion dictionary repository."""
from typing import Optional
from app.repositories.base import BaseRepository
from app.models.user_emotion_dict import UserEmotionDict


class EmotionDictRepository(BaseRepository[UserEmotionDict]):
    def __init__(self, session):
        super().__init__(UserEmotionDict, session)

    def get_by_user_and_key(self, user_id: str, emotion_key: str) -> Optional[UserEmotionDict]:
        return self.find_one(user_id=user_id, emotion_key=emotion_key)

    def get_all_by_user(self, user_id: str) -> list[UserEmotionDict]:
        return self.find_all(user_id=user_id)

    def upsert(self, user_id: str, emotion_key: str, **params) -> UserEmotionDict:
        existing = self.get_by_user_and_key(user_id, emotion_key)
        if existing:
            for k, v in params.items():
                setattr(existing, k, v)
            return existing
        return self.create(UserEmotionDict(
            user_id=user_id,
            emotion_key=emotion_key,
            **params,
        ))
