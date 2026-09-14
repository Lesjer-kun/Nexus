"""
NEXUS Backend - FastAPI Application Compatibility Shim
Allows running via:
  uvicorn app:app --port 8000 --reload
  or
  uvicorn main:app --port 8000 --reload
"""

import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # noqa: F401
