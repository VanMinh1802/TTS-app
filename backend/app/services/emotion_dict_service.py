"""User emotion dictionary service."""
from sqlalchemy import select

from app.models.user_emotion_dict import UserEmotionDict
from app.repositories.emotion_dict import EmotionDictRepository


class EmotionDictService:
    """Service for user emotion dictionary operations."""

    def __init__(self, repo: EmotionDictRepository):
        self.repo = repo
        self.db = repo.session

    def get_by_user(
        self, user_id: str
    ) -> list[UserEmotionDict]:
        """Get all custom emotion params for a user."""
        stmt = select(UserEmotionDict).where(
            UserEmotionDict.user_id == user_id
        )
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def upsert(
        self, user_id: str, emotion_key: str, length_scale: float, noise_scale: float
    ) -> UserEmotionDict:
        """Create or update emotion params for a user."""
        stmt = select(UserEmotionDict).where(
            UserEmotionDict.user_id == user_id,
            UserEmotionDict.emotion_key == emotion_key
        )
        result = self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.length_scale = length_scale
            existing.noise_scale = noise_scale
            self.db.commit()
            self.db.refresh(existing)
            return existing

        new_dict = UserEmotionDict(
            user_id=user_id,
            emotion_key=emotion_key,
            length_scale=length_scale,
            noise_scale=noise_scale
        )
        self.db.add(new_dict)
        self.db.commit()
        self.db.refresh(new_dict)
        return new_dict

    def delete(self, user_id: str, emotion_key: str) -> bool:
        """Delete custom emotion params for a user."""
        stmt = select(UserEmotionDict).where(
            UserEmotionDict.user_id == user_id,
            UserEmotionDict.emotion_key == emotion_key
        )
        result = self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            self.db.delete(existing)
            self.db.commit()
            return True
        return False