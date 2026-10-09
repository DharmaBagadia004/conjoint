"""add conjoint design config

Revision ID: a81c7d2e4f90
Revises: 4d3a9f8b2c11
Create Date: 2026-10-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "a81c7d2e4f90"
down_revision = "4d3a9f8b2c11"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("conjoint_survey", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("design_config", sa.JSON(), nullable=False, server_default="{}")
        )


def downgrade():
    with op.batch_alter_table("conjoint_survey", schema=None) as batch_op:
        batch_op.drop_column("design_config")
