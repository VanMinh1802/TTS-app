"""add_revoked_tokens_table

Revision ID: 94dc516ce551
Revises: 61dcc5ff91d8
Create Date: 2026-05-13 08:59:49.744975

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94dc516ce551'
down_revision: Union[str, None] = '61dcc5ff91d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'revoked_tokens',
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('jti')
    )


def downgrade() -> None:
    op.drop_table('revoked_tokens')
