"""Add user_quotas and usage_history tables

Revision ID: 002
Revises: 001
Create Date: 2026-04-19 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_quotas table
    op.create_table(
        'user_quotas',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('tier', sa.String(50), server_default='free'),
        sa.Column('characters_used', sa.Integer, server_default='0'),
        sa.Column('characters_limit', sa.Integer, server_default='5000'),
        sa.Column('storage_used_mb', sa.Integer, server_default='0'),
        sa.Column('storage_limit_mb', sa.Integer, server_default='100'),
        sa.Column('api_calls_today', sa.Integer, server_default='0'),
        sa.Column('api_calls_limit', sa.Integer, server_default='100'),
        sa.Column('last_reset_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_user_quotas_user_id', 'user_quotas', ['user_id'], unique=True)

    # Create usage_history table
    op.create_table(
        'usage_history',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('date', sa.DateTime, nullable=False),
        sa.Column('characters_used', sa.Integer, server_default='0'),
        sa.Column('api_calls', sa.Integer, server_default='0'),
        sa.Column('storage_mb', sa.Integer, server_default='0'),
    )
    op.create_index('ix_usage_history_user_id', 'usage_history', ['user_id'])
    op.create_index('ix_usage_history_date', 'usage_history', ['date'])


def downgrade() -> None:
    op.drop_table('usage_history')
    op.drop_table('user_quotas')