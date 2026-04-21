"""Merge multiple heads

Revision ID: 9f90c08d757b
Revises: 002, analytics_001
Create Date: 2026-04-21 08:26:12.668697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f90c08d757b'
down_revision: Union[str, None] = ('002', 'analytics_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
