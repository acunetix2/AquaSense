from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AquaSense"
    environment: str = Field(default="development")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db.your-project.supabase.co:5432/postgres",
        alias="DATABASE_URL",
    )
    supabase_url: str = Field(default="https://your-project.supabase.co", alias="SUPABASE_URL")
    supabase_anon_key: str = Field(default="", alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    api_v1_prefix: str = "/api/v1"

    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
