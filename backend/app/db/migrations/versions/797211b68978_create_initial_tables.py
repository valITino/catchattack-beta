"""create initial tables

Revision ID: 797211b68978
Revises: 
Create Date: 2025-08-08 09:56:20.834503

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy_utils import UUIDType

# revision identifiers, used by Alembic.
revision = '797211b68978'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    attack_run_status = sa.Enum(
        'pending', 'running', 'completed', 'failed', name='attack_run_status'
    )
    detection_result_status = sa.Enum(
        'detected', 'not_detected', 'error', name='detection_result_status'
    )
    validation_state = sa.Enum(
        'pending', 'valid', 'invalid', name='validation_state'
    )
    deploy_job_status = sa.Enum(
        'pending', 'running', 'succeeded', 'failed', name='deploy_job_status'
    )
    severity_level = sa.Enum('low', 'medium', 'high', name='severity_level')

    bind = op.get_bind()
    attack_run_status.create(bind, checkfirst=True)
    detection_result_status.create(bind, checkfirst=True)
    validation_state.create(bind, checkfirst=True)
    deploy_job_status.create(bind, checkfirst=True)
    severity_level.create(bind, checkfirst=True)

    op.create_table(
        'rules',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    op.create_table(
        'threat_profile',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', severity_level, nullable=False, server_default='medium'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    op.create_table(
        'customizations',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('rule_id', UUIDType(binary=False), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_customizations_rule_id', 'customizations', ['rule_id'])

    op.create_table(
        'attack_runs',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('rule_id', UUIDType(binary=False), nullable=True),
        sa.Column('threat_profile_id', UUIDType(binary=False), nullable=True),
        sa.Column('status', attack_run_status, nullable=False, server_default='pending'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['threat_profile_id'], ['threat_profile.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_attack_runs_rule_id', 'attack_runs', ['rule_id'])
    op.create_index('ix_attack_runs_threat_profile_id', 'attack_runs', ['threat_profile_id'])

    op.create_table(
        'detection_results',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('attack_run_id', UUIDType(binary=False), nullable=False),
        sa.Column('rule_id', UUIDType(binary=False), nullable=False),
        sa.Column('status', detection_result_status, nullable=False, server_default='detected'),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['attack_run_id'], ['attack_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_detection_results_attack_run_id', 'detection_results', ['attack_run_id'])
    op.create_index('ix_detection_results_rule_id', 'detection_results', ['rule_id'])

    op.create_table(
        'validation_status',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('rule_id', UUIDType(binary=False), nullable=False),
        sa.Column('status', validation_state, nullable=False, server_default='pending'),
        sa.Column('checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('rule_id'),
    )

    op.create_table(
        'deploy_versions',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('version', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version'),
    )

    op.create_table(
        'deploy_jobs',
        sa.Column('id', UUIDType(binary=False), nullable=False),
        sa.Column('version_id', UUIDType(binary=False), nullable=True),
        sa.Column('status', deploy_job_status, nullable=False, server_default='pending'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['version_id'], ['deploy_versions.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_deploy_jobs_version_id', 'deploy_jobs', ['version_id'])

def downgrade() -> None:
    op.drop_index('ix_deploy_jobs_version_id', table_name='deploy_jobs')
    op.drop_table('deploy_jobs')

    op.drop_table('deploy_versions')

    op.drop_table('validation_status')

    op.drop_index('ix_detection_results_rule_id', table_name='detection_results')
    op.drop_index('ix_detection_results_attack_run_id', table_name='detection_results')
    op.drop_table('detection_results')

    op.drop_index('ix_attack_runs_threat_profile_id', table_name='attack_runs')
    op.drop_index('ix_attack_runs_rule_id', table_name='attack_runs')
    op.drop_table('attack_runs')

    op.drop_index('ix_customizations_rule_id', table_name='customizations')
    op.drop_table('customizations')

    op.drop_table('threat_profile')

    op.drop_table('rules')

    sa.Enum(name='deploy_job_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='validation_state').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='detection_result_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='attack_run_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='severity_level').drop(op.get_bind(), checkfirst=True)
