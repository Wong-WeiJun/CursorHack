"""add tasks and share token

Revision ID: f3a9c1d2e8b4
Revises: b734b6d7be3d
Create Date: 2026-07-03 13:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'f3a9c1d2e8b4'
down_revision = 'b734b6d7be3d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'user',
        sa.Column('share_token', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.create_index(
        op.f('ix_user_share_token'), 'user', ['share_token'], unique=True
    )
    op.create_table(
        'task',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('subject', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('priority', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('is_done', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('task')
    op.drop_index(op.f('ix_user_share_token'), table_name='user')
    op.drop_column('user', 'share_token')
