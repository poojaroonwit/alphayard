from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    JWT_SECRET: str
    REDIS_URL: str = "redis://localhost:6379"
    BONDARY_BACKEND_URL: str = "http://localhost:4000"
    AI_ADMIN_SECRET: str
    DEFAULT_MODEL: str = "claude-sonnet-4-6"
    PORT: int = 5001


config = Settings()
