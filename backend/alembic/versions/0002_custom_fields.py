"""add custom fields for activities

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE TYPE fieldtype AS ENUM ('text', 'duration', 'number', 'select')")

    op.create_table(
        "activity_custom_fields",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("activity_id", sa.Integer(), sa.ForeignKey("activities.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("field_type", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    # Cast the text column to use the enum type
    op.execute("ALTER TABLE activity_custom_fields ALTER COLUMN field_type TYPE fieldtype USING field_type::fieldtype")
    op.create_index("ix_activity_custom_fields_id", "activity_custom_fields", ["id"])

    op.create_table(
        "activity_log_field_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("log_id", sa.Integer(), sa.ForeignKey("activity_log.id"), nullable=False),
        sa.Column("field_id", sa.Integer(), sa.ForeignKey("activity_custom_fields.id"), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_log_field_values_id", "activity_log_field_values", ["id"])


def downgrade():
    op.drop_index("ix_activity_log_field_values_id", table_name="activity_log_field_values")
    op.drop_table("activity_log_field_values")
    op.drop_index("ix_activity_custom_fields_id", table_name="activity_custom_fields")
    op.drop_table("activity_custom_fields")
    op.execute("DROP TYPE fieldtype")
