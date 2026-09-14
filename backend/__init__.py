"""
NEXUS Backend Package
Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management
(SIH 2026 - Problem Statement SIH26122)
"""

import sys
from pathlib import Path

# Add backend directory to sys.path so submodules resolve directly
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

__version__ = "1.0.0"
