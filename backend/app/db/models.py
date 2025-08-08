"""Database models and base metadata."""

from __future__ import annotations

import uuid
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from sqlalchemy_utils import UUIDType


Base = declarative_base()


class TimestampMixin:
    """Mixin providing created/updated timestamps."""

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class AttackRunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class DetectionResultStatus(str, Enum):
    DETECTED = "detected"
    NOT_DETECTED = "not_detected"
    ERROR = "error"


class ValidationState(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"


class DeployJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Rule(TimestampMixin, Base):
    __tablename__ = "rules"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, nullable=False, server_default="true")

    customizations = relationship("Customization", back_populates="rule")
    attack_runs = relationship("AttackRun", back_populates="rule")
    detection_results = relationship("DetectionResult", back_populates="rule")
    validation = relationship("ValidationStatus", uselist=False, back_populates="rule")


class Customization(TimestampMixin, Base):
    __tablename__ = "customizations"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    rule_id = Column(
        UUIDType(binary=False),
        ForeignKey("rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    data = Column(JSON, nullable=False)

    rule = relationship("Rule", back_populates="customizations")


class ThreatProfile(TimestampMixin, Base):
    __tablename__ = "threat_profile"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    severity = Column(
        SqlEnum(SeverityLevel, name="severity_level"),
        nullable=False,
        server_default=SeverityLevel.MEDIUM.value,
    )

    attack_runs = relationship("AttackRun", back_populates="threat_profile")


class AttackRun(TimestampMixin, Base):
    __tablename__ = "attack_runs"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUIDType(binary=False), ForeignKey("rules.id", ondelete="SET NULL"), index=True)
    threat_profile_id = Column(
        UUIDType(binary=False), ForeignKey("threat_profile.id", ondelete="SET NULL"), index=True
    )
    status = Column(
        SqlEnum(AttackRunStatus, name="attack_run_status"),
        nullable=False,
        server_default=AttackRunStatus.PENDING.value,
    )
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))

    rule = relationship("Rule", back_populates="attack_runs")
    threat_profile = relationship("ThreatProfile", back_populates="attack_runs")
    detection_results = relationship("DetectionResult", back_populates="attack_run")


class DetectionResult(TimestampMixin, Base):
    __tablename__ = "detection_results"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    attack_run_id = Column(
        UUIDType(binary=False),
        ForeignKey("attack_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_id = Column(
        UUIDType(binary=False),
        ForeignKey("rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        SqlEnum(DetectionResultStatus, name="detection_result_status"),
        nullable=False,
        server_default=DetectionResultStatus.DETECTED.value,
    )
    details = Column(JSON)

    attack_run = relationship("AttackRun", back_populates="detection_results")
    rule = relationship("Rule", back_populates="detection_results")


class ValidationStatus(TimestampMixin, Base):
    __tablename__ = "validation_status"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    rule_id = Column(
        UUIDType(binary=False),
        ForeignKey("rules.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status = Column(
        SqlEnum(ValidationState, name="validation_state"),
        nullable=False,
        server_default=ValidationState.PENDING.value,
    )
    checked_at = Column(DateTime(timezone=True))

    rule = relationship("Rule", back_populates="validation")


class DeployVersion(TimestampMixin, Base):
    __tablename__ = "deploy_versions"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    version = Column(String(100), nullable=False, unique=True)
    description = Column(Text)

    deploy_jobs = relationship("DeployJob", back_populates="version")


class DeployJob(TimestampMixin, Base):
    __tablename__ = "deploy_jobs"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    version_id = Column(
        UUIDType(binary=False),
        ForeignKey("deploy_versions.id", ondelete="SET NULL"),
        index=True,
    )
    status = Column(
        SqlEnum(DeployJobStatus, name="deploy_job_status"),
        nullable=False,
        server_default=DeployJobStatus.PENDING.value,
    )
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))

    version = relationship("DeployVersion", back_populates="deploy_jobs")


__all__ = [
    "Base",
    "Rule",
    "Customization",
    "AttackRun",
    "DetectionResult",
    "ValidationStatus",
    "DeployJob",
    "DeployVersion",
    "ThreatProfile",
]

