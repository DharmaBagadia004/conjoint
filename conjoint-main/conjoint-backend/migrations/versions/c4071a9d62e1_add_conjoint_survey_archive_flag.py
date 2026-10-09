"""add conjoint survey archive flag

Revision ID: c4071a9d62e1
Revises: a81c7d2e4f90
Create Date: 2026-10-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "c4071a9d62e1"
down_revision = "a81c7d2e4f90"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("conjoint_survey", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false())
        )


def downgrade():
    with op.batch_alter_table("conjoint_survey", schema=None) as batch_op:
        batch_op.drop_column("is_archived")
