"""Add user_emotion_dicts table

Revision ID: 20260422_user_emotion_dicts
Revises: 20260422_emotion_params
Create Date: 2026-04-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260422_user_emotion_dicts"
down_revision: Union[str, None] = "20260422_emotion_params"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_emotion_dicts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("emotion_key", sa.String(50), nullable=False),
        sa.Column("length_scale", sa.Float, nullable=False, server_default="1.0"),
        sa.Column("noise_scale", sa.Float, nullable=False, server_default="0.667"),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("user_emotion_dicts")