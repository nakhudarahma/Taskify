import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Taskify Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL fix for SQLAlchemy + Render/Supabase
    _database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname").strip()
    @property
    def DATABASE_URL(self) -> str:
        url = self._database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    GROQ_API_KEY: str | None = None
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8080").strip()

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()