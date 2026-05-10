"""add_is_admin_and_duration_columns

Revision ID: 61dcc5ff91d8
Revises: 38c20e4cafd1
Create Date: 2026-05-10 12:35:35.488687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61dcc5ff91d8'
down_revision: Union[str, None] = '38c20e4cafd1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("audio_records", sa.Column("duration", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("audio_records", "duration")
