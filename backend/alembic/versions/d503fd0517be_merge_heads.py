"""merge_heads

Revision ID: d503fd0517be
Revises: 20260422_user_emotion_dicts, e27e8bc2dfb7
Create Date: 2026-05-04 18:35:24.633866

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd503fd0517be'
down_revision: Union[str, None] = ('20260422_user_emotion_dicts', 'e27e8bc2dfb7')
branch_labels: Union[str, Sequence[str], None] = ('none',)
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
