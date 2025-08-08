from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Dict


class Settings(BaseSettings):
    env: str = "dev"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    db_dsn: str = "postgresql+psycopg://postgres:postgres@db:5432/catchattack"
    cors_origins: list[str] = ["http://localhost:3000"]
    jwt_secret: str = "changeme-in-.env"
    users: List[Dict[str, str]] = Field(
        default_factory=lambda: [
            {"username": "admin", "password": "adminpass", "role": "admin"},
            {"username": "analyst", "password": "analystpass", "role": "analyst"},
            {"username": "viewer", "password": "viewerpass", "role": "viewer"},
        ]
    )
    artifacts_dir: str = "/app/backend/artifacts"
    elastic_url: str = "http://elastic:9200"
    elastic_index_prefix: str = "events"

    class Config:
        env_file = ".env"


settings = Settings()
