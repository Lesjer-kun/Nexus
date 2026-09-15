"""
NEXUS Backend - Application Entrypoint
Neural Engine for eXecution Understanding & Schedule Synchronization
SIH 2026 Problem Statement SIH26122 (Oil India Limited)
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

# Ensure backend root directory is on sys.path for direct imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import settings
from database.db import init_db, SessionLocal
from database.seed_data import seed_database
from routers import (
    field_capture,
    extraction,
    matching,
    baseline,
    governance,
    evidence,
    audit,
    memory,
    risk,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexus.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and pre-seed project baseline
    logger.info("Initializing NEXUS database schema...")
    init_db()

    if settings.AUTO_SEED:
        logger.info("Verifying baseline project seed data...")
        db = SessionLocal()
        try:
            seed_database(db)
            logger.info("Baseline seed verified successfully.")
        finally:
            db.close()

    yield
    logger.info("Shutting down NEXUS backend.")


app = FastAPI(
    title="NEXUS Backend - Intelligent Schedule-Linking Layer",
    description=(
        "Field-to-schedule execution intelligence layer for infrastructure project management. "
        "Transforms unstructured voice/text into structured Execution Events and links to L5/L6 schedule activities."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Next.js, Vite, and mobile web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers with /api prefix (primary API namespace)
app.include_router(field_capture.router, prefix="/api")
app.include_router(extraction.router, prefix="/api")
app.include_router(matching.router, prefix="/api")
app.include_router(baseline.router, prefix="/api")
app.include_router(governance.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(risk.router, prefix="/api/risk")

# Also mount Routers without /api prefix for maximum client interoperability
app.include_router(field_capture.router)
app.include_router(extraction.router)
app.include_router(matching.router)
app.include_router(baseline.router)
app.include_router(governance.router)
app.include_router(evidence.router)
app.include_router(audit.router)
app.include_router(memory.router)
app.include_router(risk.router, prefix="/risk")


@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "NEXUS Intelligent Data Capture & Schedule-Linking Layer",
        "version": "1.0.0",
        "database": "online",
    }


@app.get("/")
def root():
    return {
        "name": "NEXUS - Intelligent Data Capture & Schedule-Linking Layer",
        "sponsoring_org": "Oil India Limited",
        "problem_statement": "SIH26122",
        "docs_url": "/docs",
        "key_services": [
            "1. Project & Schedule Baseline Service (/api/projects, /api/activities)",
            "2. Field Capture & Ingestion Pipeline (/api/events)",
            "3. AI Extraction & NLP Pipeline (/api/extract, /api/extract/normalize, /api/extract/validate)",
            "4. Semantic Schedule Matching Service (/api/match/candidates, /api/match/score, /api/match/select)",
            "5. Evidence & Provenance Service (/api/evidence/upload, /api/evidence/{id})",
            "6. Governance & Approval Workflow (/api/events/{id}/governance, /api/reviews/pending)",
            "7. Authoritative Schedule Management (/api/activities/{id}/variance)",
            "8. Audit Trail & Immutable Ledger (/api/audit-logs)",
            "9. Institutional Memory & RAG Service (/api/memory/search, /api/memory/records)",
            "10. Risk & Alert Service (/api/risk/alerts, /api/risk/evaluate)",
        ],
    }
