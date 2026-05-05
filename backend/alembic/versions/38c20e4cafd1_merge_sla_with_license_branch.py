"""merge_sla_with_license_branch

Revision ID: 38c20e4cafd1
Revises: 20260427_sla_level, 39692003c2d8
Create Date: 2026-05-05 20:16:17.684598

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '38c20e4cafd1'
down_revision: Union[str, None] = ('20260427_sla_level', '39692003c2d8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
