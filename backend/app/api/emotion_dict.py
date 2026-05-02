"""User emotion dictionary API routes."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.user_emotion_dict import (
    UserEmotionDictCreate,
    UserEmotionDictResponse,
    UserEmotionDictUpdate,
)
from app.services.emotion_dict_service import EmotionDictService

router = APIRouter(
    prefix="/users/me/emotion-dict",
    tags=["Emotion Dictionary"]
)


@router.get("", response_model=dict)
def get_emotion_dict(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get all custom emotion params for current user."""
    service = EmotionDictService(db)
    user_dicts = service.get_by_user(current_user.id)
    return {
        "data": [
            {
                "emotion": d.emotion_key,
                "length_scale": d.length_scale,
                "noise_scale": d.noise_scale,
            }
            for d in user_dicts
        ]
    }


@router.put("/{emotion_key}", response_model=dict)
def upsert_emotion_dict(
    emotion_key: str,
    body: UserEmotionDictUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create or update emotion params for a user."""
    service = EmotionDictService(db)

    existing_stmt = service.get_by_user(current_user.id)
    existing = next(
        (d for d in existing_stmt if d.emotion_key == emotion_key),
        None
    )

    length_scale = body.length_scale if body.length_scale is not None else (existing.length_scale if existing else 1.0)
    noise_scale = body.noise_scale if body.noise_scale is not None else (existing.noise_scale if existing else 0.667)

    updated = service.upsert(
        user_id=current_user.id,
        emotion_key=emotion_key,
        length_scale=length_scale,
        noise_scale=noise_scale,
    )

    return {
        "data": {
            "emotion": updated.emotion_key,
            "length_scale": updated.length_scale,
            "noise_scale": updated.noise_scale,
        }
    }


@router.delete("/{emotion_key}", response_model=dict)
def delete_emotion_dict(
    emotion_key: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Delete custom emotion params for a user."""
    service = EmotionDictService(db)
    deleted = service.delete(current_user.id, emotion_key)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emotion not found",
        )

    return {"success": True}