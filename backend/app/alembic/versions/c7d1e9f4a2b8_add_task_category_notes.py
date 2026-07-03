"""add task category and notes

Revision ID: c7d1e9f4a2b8
Revises: f3a9c1d2e8b4
Create Date: 2026-07-03 14:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'c7d1e9f4a2b8'
down_revision = 'f3a9c1d2e8b4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'task',
        sa.Column(
            'category',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='class',
        ),
    )
    op.add_column(
        'task',
        sa.Column(
            'notes',
            sqlmodel.sql.sqltypes.AutoString(length=2000),
            nullable=True,
        ),
    )
    # Drop the server default now that existing rows are backfilled.
    op.alter_column('task', 'category', server_default=None)


def downgrade():
    op.drop_column('task', 'notes')
    op.drop_column('task', 'category')
