"""
NEXUS - Application Configuration
Centralized configuration for AI models, database URLs, confidence thresholds,
and construction domain vocabularies.
"""

import os
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="allow")

    # App
    PROJECT_NAME: str = "NEXUS Backend"
    API_PREFIX: str = "/api"
    DEBUG: bool = True

    # Database
    # If DATABASE_URL is postgresql with pgvector, it will use that.
    # Otherwise, it falls back seamlessly to SQLite with numpy vector math.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nexus_local.db")
    AUTO_SEED: bool = True

    # AI / LLM Configuration
    ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    VOYAGE_API_KEY: str | None = os.getenv("VOYAGE_API_KEY")

    PRIMARY_LLM_PROVIDER: str = os.getenv("PRIMARY_LLM_PROVIDER", "anthropic")  # anthropic | openai | gemini | local
    LLM_MODEL: str = os.getenv("LLM_MODEL", "claude-sonnet-5")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Embedding model configuration
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "auto")  # voyage | openai | local
    EMBEDDING_DIM: int = 1024  # Standardized dimension for pgvector/sqlite

    # Governed Confidence Thresholds (Blueprint Section 6.4 / 9)
    AUTO_ACCEPT_THRESHOLD: float = 0.90
    REVIEW_THRESHOLD: float = 0.60

    # Default Project Configuration
    DEFAULT_PROJECT_ID: int = 1
    DEFAULT_PROJECT_CODE: str = "OIL-DNPL-01"

settings = Settings()
