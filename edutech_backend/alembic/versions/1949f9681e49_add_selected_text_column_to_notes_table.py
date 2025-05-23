"""Add selected_text column to notes table

Revision ID: 1949f9681e49
Revises: 
Create Date: 2025-05-23 13:48:38.098676

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1949f9681e49'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade():
    op.add_column('notes', sa.Column('selected_text', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('notes', 'selected_text')

