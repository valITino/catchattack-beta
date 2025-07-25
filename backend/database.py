from sqlalchemy import Column, Integer, String, create_engine
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


def init_db():
    Base.metadata.create_all(bind=engine)
