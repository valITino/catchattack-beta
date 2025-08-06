from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./catchattack.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Emulation(Base):
    __tablename__ = "emulations"

    id = Column(Integer, primary_key=True, index=True)
    technique_id = Column(String, index=True)
    status = Column(String, default="pending")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, nullable=True, index=True)
    type = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def add_audit_event(
    db_session, *, tenant_id: str | None, type: str, title: str, description: str
) -> AuditEvent:
    event = AuditEvent(
        tenant_id=tenant_id, type=type, title=title, description=description
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event
