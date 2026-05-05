"""sla_level — stub

Revision ID: 20260427_sla_level
Revises: e27e8bc2dfb7
Create Date: 2026-05-05 20:15:00

This migration was applied from another branch. Stub for local compatibility.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '20260427_sla_level'
down_revision: Union[str, None] = 'e27e8bc2dfb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
