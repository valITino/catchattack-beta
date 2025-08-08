from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    env: str = "dev"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    db_dsn: str = "postgresql+psycopg://postgres:postgres@db:5432/catchattack"
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
