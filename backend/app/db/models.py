from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column
from sqlalchemy import (
    String,
    Text,
    Enum,
    ForeignKey,
    Integer,
    Boolean,
    DateTime,
    JSON,
    UniqueConstraint,
    Index,
    ARRAY,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum
import uuid

Base = declarative_base()


# --- Enums ---
class RuleStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    disabled = "disabled"


class RunSource(str, enum.Enum):
    local = "local"
    atomic = "atomic"
    caldera = "caldera"
    ai_generated = "ai_generated"


class RunStatus(str, enum.Enum):
    created = "created"
    running = "running"
    completed = "completed"
    failed = "failed"


class DeployTarget(str, enum.Enum):
    elastic = "elastic"
    splunk = "splunk"
    sentinel = "sentinel"


class JobStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    success = "success"
    error = "error"
    rolled_back = "rolled_back"


class DeployVersionStatus(str, enum.Enum):
    deployed = "deployed"
    rolled_back = "rolled_back"
    error = "error"


# --- Mixins ---
class TimestampMixin:
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


# --- Tables ---
class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # admin|analyst|viewer


class Rule(Base, TimestampMixin):
    __tablename__ = "rules"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    attack_techniques: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[])
    sigma_yaml: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[RuleStatus] = mapped_column(
        Enum(RuleStatus, name="rule_status"), default=RuleStatus.draft, nullable=False
    )
    provenance: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # {source, uri, author, imported_at}
    logic_hash: Mapped[str | None] = mapped_column(
        String(64), index=True
    )  # sha256 of normalized YAML

    customizations = relationship(
        "Customization", back_populates="rule", cascade="all,delete-orphan"
    )
    validation = relationship(
        "ValidationStatus", uselist=False, back_populates="rule", cascade="all,delete-orphan"
    )

    __table_args__ = (
        Index("ix_rules_techniques_gin", "attack_techniques", postgresql_using="gin"),
    )


class Customization(Base, TimestampMixin):
    __tablename__ = "customizations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    overlays: Mapped[dict] = mapped_column(JSON, nullable=False)  # RFC6902 JSON Patch array
    notes: Mapped[str | None] = mapped_column(Text)

    rule = relationship("Rule", back_populates="customizations")
    __table_args__ = (Index("ix_customizations_rule_owner", "rule_id", "owner"),)


class AttackRun(Base, TimestampMixin):
    __tablename__ = "attack_runs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    techniques: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[])
    source: Mapped[RunSource] = mapped_column(Enum(RunSource, name="run_source"), nullable=False)
    status: Mapped[RunStatus] = mapped_column(
        Enum(RunStatus, name="run_status"), default=RunStatus.created, nullable=False
    )
    started_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    environment: Mapped[dict | None] = mapped_column(JSON)

    results = relationship("DetectionResult", back_populates="run", cascade="all,delete-orphan")

    __table_args__ = (Index("ix_attack_runs_status", "status"),)


class DetectionResult(Base, TimestampMixin):
    __tablename__ = "detection_results"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )
    hit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    evidence_uri: Mapped[str | None] = mapped_column(Text)
    sample_events: Mapped[list[dict] | None] = mapped_column(ARRAY(JSON))
    evaluated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    run = relationship("AttackRun", back_populates="results")
    rule = relationship("Rule")

    __table_args__ = (
        UniqueConstraint("run_id", "rule_id", name="uq_result_run_rule"),
        Index("ix_detection_results_run", "run_id"),
        Index("ix_detection_results_rule", "rule_id"),
    )


class ValidationStatus(Base, TimestampMixin):
    __tablename__ = "validation_status"
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rules.id", ondelete="CASCADE"), primary_key=True
    )
    last_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("attack_runs.id", ondelete="SET NULL")
    )
    tp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fn: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    precision: Mapped[float | None] = mapped_column()
    recall: Mapped[float | None] = mapped_column()
    support: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    confidence: Mapped[float | None] = mapped_column()
    recent_hit_rate: Mapped[float | None] = mapped_column()
    sample_diversity: Mapped[float | None] = mapped_column()
    data_freshness: Mapped[float | None] = mapped_column()
    last_validated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    rule = relationship("Rule", back_populates="validation")
    last_run = relationship("AttackRun")


class DeployJob(Base, TimestampMixin):
    __tablename__ = "deploy_jobs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target: Mapped[DeployTarget] = mapped_column(
        Enum(DeployTarget, name="deploy_target"), nullable=False
    )
    submitted_by: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status"), default=JobStatus.pending, nullable=False
    )
    details: Mapped[dict | None] = mapped_column(JSON)

    versions = relationship("DeployVersion", back_populates="job", cascade="all,delete-orphan")
    __table_args__ = (Index("ix_deploy_jobs_target_status", "target", "status"),)


class DeployVersion(Base, TimestampMixin):
    __tablename__ = "deploy_versions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deploy_jobs.id", ondelete="CASCADE"), nullable=False
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )
    target_version_ref: Mapped[str | None] = mapped_column(String(512))
    prev_version_ref: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[DeployVersionStatus] = mapped_column(
        Enum(DeployVersionStatus, name="deploy_version_status"),
        default=DeployVersionStatus.deployed,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    job = relationship("DeployJob", back_populates="versions")
    rule = relationship("Rule")
    __table_args__ = (Index("ix_deploy_versions_job_rule", "job_id", "rule_id"),)


class ThreatProfile(Base, TimestampMixin):
    __tablename__ = "threat_profile"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(255))
    tech_stack: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[])
    intel_tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[])
    weights: Mapped[dict | None] = mapped_column(JSON)

    __table_args__ = (Index("ix_threat_profile_org", "organization"),)


class ValidationSchedule(Base, TimestampMixin):
    __tablename__ = "validation_schedules"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    cron: Mapped[str] = mapped_column(String(255), nullable=False, default="0 2 * * *")
    dataset_uri: Mapped[str] = mapped_column(String(512), nullable=False)
    engine: Mapped[str] = mapped_column(String(50), nullable=False, default="local")
    techniques: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[])
    rule_ids: Mapped[list[uuid.UUID] | None] = mapped_column(ARRAY(UUID(as_uuid=True)))
    auto_index: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_run_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (Index("ix_validation_schedules_enabled", "enabled"),)


class ImportLog(Base, TimestampMixin):
    __tablename__ = "import_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(128), nullable=False)  # e.g., "folder", "url"
    uri: Mapped[str] = mapped_column(String(1024), nullable=False)
    total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    inserted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deduped: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    errors: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB)  # optional per-file info
