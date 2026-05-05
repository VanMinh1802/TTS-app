"""Drop priority column from dictionary_entries.

Revision ID: drop_dict_priority
Revises: dictionary_001
Create Date: 2026-05-05 13:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "drop_dict_priority"
down_revision: Union[str, None] = "dictionary_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_dictionary_entries_priority", table_name="dictionary_entries")
    op.drop_column("dictionary_entries", "priority")


def downgrade() -> None:
    op.add_column("dictionary_entries", sa.Column("priority", sa.Integer(), nullable=False, server_default="1"))
    op.create_index("ix_dictionary_entries_priority", "dictionary_entries", ["priority"])
