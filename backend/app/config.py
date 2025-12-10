from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_model: str = "anthropic/claude-sonnet-4"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = False

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
