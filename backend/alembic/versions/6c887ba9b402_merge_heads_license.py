"""merge_heads_license

Revision ID: 6c887ba9b402
Revises: 8f09c37a037c
Create Date: 2026-05-05 20:06:36.883244

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c887ba9b402'
down_revision: Union[str, None] = '8f09c37a037c'
branch_labels: Union[str, Sequence[str], None] = ('license_branch',)
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("license_keys", sa.Column("code_hash", sa.String(64), nullable=True))
    op.create_index("ix_license_keys_code_hash", "license_keys", ["code_hash"])
    op.create_table(
        "activation_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("success", sa.Boolean, default=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime, default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("activation_logs")
    op.drop_index("ix_license_keys_code_hash")
    op.drop_column("license_keys", "code_hash")
