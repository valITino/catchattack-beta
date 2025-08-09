"""rules provenance+logic_hash, import_logs

Revision ID: 0003_rules_provenance_logic_hash_import_logs
Revises: 0002_users
Create Date: 2025-08-09 13:15:09.072721

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0003_rules_provenance_logic_hash_import_logs"
down_revision = "0002_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rules", sa.Column("provenance", postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    op.add_column("rules", sa.Column("logic_hash", sa.String(length=64), nullable=True))
    op.create_index("ix_rules_logic_hash", "rules", ["logic_hash"])

    op.create_table(
        "import_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("uri", sa.String(length=1024), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("inserted", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("deduped", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("errors", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("import_logs")
    op.drop_index("ix_rules_logic_hash", table_name="rules")
    op.drop_column("rules", "logic_hash")
    op.drop_column("rules", "provenance")
