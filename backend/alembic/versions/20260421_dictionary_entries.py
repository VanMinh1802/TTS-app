"""Add dictionary entries table.

Revision ID: dictionary_001
Revises: 9e0662b10ec7
Create Date: 2026-04-21 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "dictionary_001"
down_revision: Union[str, None] = "9e0662b10ec7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dictionary_entries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("word", sa.String(length=100), nullable=False),
        sa.Column("pronunciation", sa.String(length=200), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "word", name="uq_dictionary_entries_user_word"),
    )
    op.create_index("ix_dictionary_entries_user_id", "dictionary_entries", ["user_id"])
    op.create_index("ix_dictionary_entries_word", "dictionary_entries", ["word"])
    op.create_index("ix_dictionary_entries_priority", "dictionary_entries", ["priority"])


def downgrade() -> None:
    op.drop_index("ix_dictionary_entries_priority", table_name="dictionary_entries")
    op.drop_index("ix_dictionary_entries_word", table_name="dictionary_entries")
    op.drop_index("ix_dictionary_entries_user_id", table_name="dictionary_entries")
    op.drop_table("dictionary_entries")
