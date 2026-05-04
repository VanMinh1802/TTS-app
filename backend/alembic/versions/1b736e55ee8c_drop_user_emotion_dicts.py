"""drop_user_emotion_dicts

Revision ID: 1b736e55ee8c
Revises: ccac3af0a918
Create Date: 2026-05-04 20:54:58.715895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b736e55ee8c'
down_revision: Union[str, None] = 'ccac3af0a918'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("user_emotion_dicts", if_exists=True)


def downgrade() -> None:
    op.create_table(
        "user_emotion_dicts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("emotion_key", sa.String(50), nullable=False),
        sa.Column("length_scale", sa.Float, default=1.0),
        sa.Column("noise_scale", sa.Float, default=0.667),
        sa.Column("created_at", sa.DateTime, default=sa.func.now()),
    )
