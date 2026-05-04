"""Add emotion_params to segments table

Revision ID: 20260422_emotion_params
Revises: 20260420_analytics
Create Date: 2026-04-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "20260422_emotion_params"
down_revision: Union[str, None] = "analytics_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "segments",
        sa.Column("emotion_params", JSONB, nullable=True)
    )


def downgrade() -> None:
    op.drop_column("segments", "emotion_params")