"""drop_deprecated_tables

Revision ID: ccac3af0a918
Revises: 38bce528ac87
Create Date: 2026-05-04 18:35:49.670258

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccac3af0a918'
down_revision: Union[str, None] = '38bce528ac87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('project_export_jobs', if_exists=True)
    op.drop_table('segments', if_exists=True)
    op.drop_table('scenes', if_exists=True)
    op.drop_table('projects', if_exists=True)
    op.drop_table('voices', if_exists=True)


def downgrade() -> None:
    # Re-create deprecated tables (empty — no recovery needed for pre-production)
    pass
