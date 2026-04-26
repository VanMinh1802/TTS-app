"""Merge heads

Revision ID: 996480509d89
Revises: dictionary_001, c2a3390687cc
Create Date: 2026-04-26 10:01:42.520106

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '996480509d89'
down_revision: Union[str, None] = ('dictionary_001', 'c2a3390687cc')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
