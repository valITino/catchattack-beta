from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    rule_status = sa.Enum("draft","active","disabled", name="rule_status")
    run_source = sa.Enum("local","atomic","caldera","ai_generated", name="run_source")
    run_status = sa.Enum("created","running","completed","failed", name="run_status")
    deploy_target = sa.Enum("elastic","splunk","sentinel", name="deploy_target")
    job_status = sa.Enum("pending","running","success","error","rolled_back", name="job_status")
    deploy_version_status = sa.Enum("deployed","rolled_back","error", name="deploy_version_status")

    rule_status.create(op.get_bind(), checkfirst=True)
    run_source.create(op.get_bind(), checkfirst=True)
    run_status.create(op.get_bind(), checkfirst=True)
    deploy_target.create(op.get_bind(), checkfirst=True)
    job_status.create(op.get_bind(), checkfirst=True)
    deploy_version_status.create(op.get_bind(), checkfirst=True)

    op.create_table("rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("attack_techniques", postgresql.ARRAY(sa.String()), server_default="{}", nullable=True),
        sa.Column("sigma_yaml", sa.Text(), nullable=False),
        sa.Column("status", rule_status, nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_rules_techniques_gin", "rules", ["attack_techniques"], postgresql_using="gin")

    op.create_table("customizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("owner", sa.String(length=255), nullable=False),
        sa.Column("overlays", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_customizations_rule_owner", "customizations", ["rule_id","owner"])

    op.create_table("attack_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("techniques", postgresql.ARRAY(sa.String()), server_default="{}", nullable=True),
        sa.Column("source", run_source, nullable=False),
        sa.Column("status", run_status, nullable=False, server_default="created"),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("environment", postgresql.JSON(astext_type=sa.Text())),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_attack_runs_status", "attack_runs", ["status"])

    op.create_table("detection_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("evidence_uri", sa.Text()),
        sa.Column("sample_events", postgresql.ARRAY(postgresql.JSON(astext_type=sa.Text()))),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("run_id","rule_id", name="uq_result_run_rule"),
    )
    op.create_index("ix_detection_results_run", "detection_results", ["run_id"])
    op.create_index("ix_detection_results_rule", "detection_results", ["rule_id"])

    op.create_table("validation_status",
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("last_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("attack_runs.id", ondelete="SET NULL")),
        sa.Column("tp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fn", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("precision", sa.Numeric(), nullable=True),
        sa.Column("recall", sa.Numeric(), nullable=True),
        sa.Column("support", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table("deploy_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("target", deploy_target, nullable=False),
        sa.Column("submitted_by", sa.String(length=255), nullable=False),
        sa.Column("status", job_status, nullable=False, server_default="pending"),
        sa.Column("details", postgresql.JSON(astext_type=sa.Text())),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_deploy_jobs_target_status", "deploy_jobs", ["target","status"])

    op.create_table("deploy_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deploy_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_version_ref", sa.String(length=512)),
        sa.Column("prev_version_ref", sa.String(length=512)),
        sa.Column("status", deploy_version_status, nullable=False, server_default="deployed"),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_deploy_versions_job_rule", "deploy_versions", ["job_id","rule_id"])

    op.create_table("threat_profile",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization", sa.String(length=255), nullable=False),
        sa.Column("industry", sa.String(length=255)),
        sa.Column("tech_stack", postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column("intel_tags", postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column("weights", postgresql.JSON(astext_type=sa.Text())),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_threat_profile_org", "threat_profile", ["organization"])

def downgrade():
    op.drop_index("ix_threat_profile_org", table_name="threat_profile")
    op.drop_table("threat_profile")

    op.drop_index("ix_deploy_versions_job_rule", table_name="deploy_versions")
    op.drop_table("deploy_versions")

    op.drop_index("ix_deploy_jobs_target_status", table_name="deploy_jobs")
    op.drop_table("deploy_jobs")

    op.drop_table("validation_status")

    op.drop_index("ix_detection_results_rule", table_name="detection_results")
    op.drop_index("ix_detection_results_run", table_name="detection_results")
    op.drop_table("detection_results")

    op.drop_index("ix_attack_runs_status", table_name="attack_runs")
    op.drop_table("attack_runs")

    op.drop_index("ix_customizations_rule_owner", table_name="customizations")
    op.drop_table("customizations")

    op.drop_index("ix_rules_techniques_gin", table_name="rules")
    op.drop_table("rules")

    # drop enums last
    for enum_name in [
        "deploy_version_status","job_status","deploy_target","run_status","run_source","rule_status"
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)

    # Note: We’re using server_default="{}" for arrays so inserts without values don’t fail.
