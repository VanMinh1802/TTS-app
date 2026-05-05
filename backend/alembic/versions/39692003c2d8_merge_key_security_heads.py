"""merge_key_security_heads

Revision ID: 39692003c2d8
Revises: drop_dict_priority, 6c887ba9b402
Create Date: 2026-05-05 20:11:05.455354

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39692003c2d8'
down_revision: Union[str, None] = ('drop_dict_priority', '6c887ba9b402')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
