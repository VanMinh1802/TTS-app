"""Add analytics tables.

Revision ID: analytics_001
Revises: 
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa


revision = 'analytics_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_admin column to users table
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false'))
    
    # Request logs table
    op.create_table(
        'request_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('method', sa.String(10), nullable=False),
        sa.Column('path', sa.String(255), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(512), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_request_logs_id', 'request_logs', ['id'])
    op.create_index('ix_request_logs_timestamp', 'request_logs', ['timestamp'])
    op.create_index('ix_request_logs_user_id', 'request_logs', ['user_id'])
    op.create_index('ix_request_logs_path', 'request_logs', ['path'])
    
    # Usage snapshots table
    op.create_table(
        'usage_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('feature', sa.String(50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('characters_used', sa.Integer(), server_default='0'),
        sa.Column('api_calls', sa.Integer(), server_default='0'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_usage_snapshots_id', 'usage_snapshots', ['id'])
    op.create_index('ix_usage_snapshots_user_id', 'usage_snapshots', ['user_id'])
    op.create_index('ix_usage_snapshots_date', 'usage_snapshots', ['date'])
    op.create_index(
        'ix_usage_snapshot_user_feature_date', 
        'usage_snapshots', 
        ['user_id', 'feature', 'date'], 
        unique=True
    )


def downgrade() -> None:
    op.drop_table('usage_snapshots')
    op.drop_table('request_logs')
    op.drop_column('users', 'is_admin')