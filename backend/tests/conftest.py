"""
NEXUS Test Configuration & Shared Pytest Fixtures
Defines 'client' and 'db_session' fixtures so running 'pytest tests/' works seamlessly out-of-the-box.
"""

import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from main import app
from database.db import SessionLocal, init_db
from database.seed_data import seed_database

@pytest.fixture(scope="session")
def db_session():
    """Provides a seeded database session for unit and integration tests."""
    init_db()
    session = SessionLocal()
    seed_database(session)
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="session")
def client():
    """Provides a FastAPI TestClient instance for testing HTTP endpoints."""
    init_db()
    session = SessionLocal()
    seed_database(session)
    session.close()

    with TestClient(app) as test_client:
        yield test_client
