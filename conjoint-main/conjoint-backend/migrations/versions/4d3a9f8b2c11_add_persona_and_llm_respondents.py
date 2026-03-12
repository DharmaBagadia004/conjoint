"""add persona and llm respondents

Revision ID: 4d3a9f8b2c11
Revises: 07a487622555
Create Date: 2026-03-10 11:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "4d3a9f8b2c11"
down_revision = "07a487622555"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "conjoint_persona",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("survey_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["survey_id"], ["conjoint_survey.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("conjoint_respondent", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "source",
                sa.String(length=20),
                nullable=False,
                server_default="human",
            )
        )
        batch_op.add_column(sa.Column("persona_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_conjoint_respondent_persona_id",
            "conjoint_persona",
            ["persona_id"],
            ["id"],
        )
        batch_op.create_index(
            "ix_conjoint_respondent_persona_id", ["persona_id"], unique=False
        )


def downgrade():
    with op.batch_alter_table("conjoint_respondent", schema=None) as batch_op:
        batch_op.drop_index("ix_conjoint_respondent_persona_id")
        batch_op.drop_constraint(
            "fk_conjoint_respondent_persona_id", type_="foreignkey"
        )
        batch_op.drop_column("persona_id")
        batch_op.drop_column("source")

    op.drop_table("conjoint_persona")
