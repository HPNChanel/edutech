"""Add is_active column to users table

Revision ID: add_user_is_active
Revises: add_selected_text
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_is_active'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add is_active column with default value True
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))


def downgrade():
    # Remove is_active column
    op.drop_column('users', 'is_active') 