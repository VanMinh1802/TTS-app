"""add_optimization_indexes

Revision ID: 38bce528ac87
Revises: d503fd0517be
Create Date: 2026-05-04 18:35:35.689032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '38bce528ac87'
down_revision: Union[str, None] = 'd503fd0517be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_api_keys_total_requests', 'api_keys', ['total_requests'])
    op.create_index('ix_audio_records_created_at', 'audio_records', ['created_at'])
    op.create_index('ix_dictionary_entries_category', 'dictionary_entries', ['category'])
    op.create_index('ix_user_quotas_tier', 'user_quotas', ['tier'])


def downgrade() -> None:
    op.drop_index('ix_user_quotas_tier')
    op.drop_index('ix_dictionary_entries_category')
    op.drop_index('ix_audio_records_created_at')
    op.drop_index('ix_api_keys_total_requests')
