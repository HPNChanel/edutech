"""Add document conversion fields

Revision ID: add_document_conversion_fields
Revises: 1949f9681e49
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_document_conversion_fields'
down_revision = '1949f9681e49'
branch_labels = None
depends_on = None

def upgrade():
    # Add conversion tracking columns to documents table
    op.add_column('documents', sa.Column('converted', sa.Boolean(), default=False, nullable=False, server_default=sa.false()))
    op.add_column('documents', sa.Column('converted_lesson_id', sa.Integer(), nullable=True))
    op.add_column('documents', sa.Column('conversion_error', sa.Text(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_documents_converted_lesson_id', 
        'documents', 
        'lessons', 
        ['converted_lesson_id'], 
        ['id'],
        ondelete='SET NULL'
    )

def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_documents_converted_lesson_id', 'documents', type_='foreignkey')
    
    # Remove columns
    op.drop_column('documents', 'conversion_error')
    op.drop_column('documents', 'converted_lesson_id')
    op.drop_column('documents', 'converted')
