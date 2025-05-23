"""Add selected_text column to notes table

Revision ID: add_selected_text
Revises: previous_revision
Create Date: 2023-05-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_selected_text'
down_revision = 'previous_revision'  # Replace with your previous revision ID
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notes', sa.Column('selected_text', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('notes', 'selected_text')
