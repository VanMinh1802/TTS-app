"""add_license_performance_indexes

Revision ID: 8f09c37a037c
Revises: 1b736e55ee8c
Create Date: 2026-05-04 21:14:09.851646

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f09c37a037c'
down_revision: Union[str, None] = '1b736e55ee8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_license_keys_used_by_id", "license_keys", ["used_by_id"])
    op.create_index("ix_license_keys_is_used", "license_keys", ["is_used"])
    op.create_index("ix_license_keys_used_at", "license_keys", ["used_at"])


def downgrade() -> None:
    op.drop_index("ix_license_keys_used_at")
    op.drop_index("ix_license_keys_is_used")
    op.drop_index("ix_license_keys_used_by_id")
