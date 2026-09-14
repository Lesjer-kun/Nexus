"""
NEXUS - Database Session & Connection Management
Supports PostgreSQL + pgvector when available, and automatically falls back
to SQLite for offline hackathon/demo operation.
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from config import settings
from database.models import Base

logger = logging.getLogger("nexus.db")

def get_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")

    try:
        if not is_sqlite:
            # Try connecting to PostgreSQL
            test_engine = create_engine(db_url, pool_pre_ping=True)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected successfully to PostgreSQL database.")
            return test_engine
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL at {db_url}: {e}. Falling back to SQLite.")

    # SQLite fallback
    fallback_url = "sqlite:///./nexus_local.db"
    sqlite_engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    logger.info(f"Using SQLite database engine: {fallback_url}")
    return sqlite_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes tables and attempts pgvector extension if on PostgreSQL."""
    try:
        if engine.dialect.name == "postgresql":
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Note on pgvector extension: {e}")

    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")

def get_db():
    """FastAPI Dependency for database sessions."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
