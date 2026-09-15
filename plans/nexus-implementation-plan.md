# NEXUS Implementation Plan

## Overview

This plan addresses the NEXUS Solution Document requirements **1** (Unified Ingestion), **3** (Evidence Validation and Provenance), and **5** (Institutional Memory & RAG) integrated into the existing FastAPI backend architecture.

**Architecture constraint:** Backward compatibility maintained. All new functionality integrates with existing models, routers, and database layer.

**Requirements addressed:**
- **Req 1:** Unified ingestion of voice, text updates, reports, spreadsheets, PDFs, and field evidence
- **Req 3:** Evidence validation and provenance tracking  
- **Req 5:** Creation of searchable institutional project memory with decision support via RAG

---

## 1. Unified Ingestion Enhancement (Requirement 1)

### 1.1 Current State
- Voice: `POST /api/events` with `input_mode` field — implemented
- Text: `POST /api/events` — implemented
- Reports/Spreadsheets/PDFs: No dedicated ingestion endpoints
- Evidence: `POST /api/evidence/upload` — stores path string; no actual file persistence

### 1.2 Changes Implemented

| Area | Change | Details |
|---|---|---|
| **Document ingestion** | Added `POST /api/ingest/document` | Accepts multipart upload; parses XLSX, CSV, PDF, DOCX using pandas/openpyxl/pdfplumber; creates ExecutionEvent with `input_mode=document` |
| **Input mode validation** | Added `input_mode` validation in `/api/events` | Enforces `voice`, `text`, or `document` as valid values |
| **Evidence upload** | Enhanced `/api/evidence/upload` | Compute SHA-256 hash; persist file to `static/uploads/`; store sanitized filename |

### 1.3 Implementation Details
- Document parsing uses: pandas (XLSX/CSV), pdfplumber/PyPDF2 (PDF), python-docx (DOCX), UTF-8 decode (TXT)
- File storage: Creates `static/uploads/` directory; saves with pattern `{event_id}_{hash}_{filename}`
- Evidence hash: SHA-256 of file content stored in `Evidence.evidence_hash`

---

## 2. Evidence Validation and Provenance Tracking (Requirement 3)

### 2.1 Current State
- `Evidence` model exists with full metadata fields
- Upload endpoint hardcoded `metadata_valid=True`, `visual_consistency_score=0.94`
- No file persistence; no EXIF/GPS validation
- No audit records for evidence operations

### 2.2 Changes Implemented

| Area | Change | Details |
|---|---|---|
| **File persistence** | Enhanced `/api/evidence/upload` | Creates `static/uploads/` directory; saves file content with sanitized filename |
| **Metadata validation** | Added `compute_metadata_validity()` | Validates GPS coordinates against project site bounds; checks accuracy plausibility |
| **Visual consistency scoring** | Added `compute_visual_consistency()` | Deterministic score based on file size, GPS location, timestamp accuracy |
| **Audit trail** | Enhanced both endpoints | `EVIDENCE_UPLOAD` audit record on upload; `EVIDENCE_VERIFY` audit record on verification |
| **GPS bounds validation** | Added `SITE_BOUNDS` constant | Duliajan-Numaligarh site bounds: lat 27.0-27.8, lng 95.0-95.8 |
| **File type validation** | Added allowed content types | `ALLOWED_IMAGE_TYPES`, `ALLOWED_DOC_TYPES`, `ALLOWED_FILE_TYPES` |

### 2.3 Implementation Details
- GPS boundary: Checks if evidence coordinates fall within site bounds ± tolerance
- Consistency score: `0.70 + format_bonus + gps_bonus + metadata_bonus` (capped at 0.99)
- Audit hash: `SHA256(event_id + hash + timestamp)` truncated to 32 chars

---

## 3. Institutional Memory & RAG (Requirement 5)

### 3.1 Current State
- `MemoryRecord` model exists
- `/api/memory/search` uses hardcoded keyword-based canned responses
- `/api/memory/ingest` hardcoded `project_id=1`
- Relevance scoring: Only embedding similarity + keyword hits

### 3.2 Changes Implemented

| Area | Change | Details |
|---|---|---|
| **Answer synthesis** | Added `_synthesize_answer_with_llm()` | Uses configured LLM (Anthropic/OpenAI/Gemini) for grounded answer generation from retrieved records |
| **Fallback behavior** | Maintains keyword-based fallback | When LLM unavailable, uses keyword-based synthesis with record citations |
| **Project ID fix** | Fixed `/api/memory/ingest` | Uses request `project_id` or resolves from `project_code` |
| **Project validation** | Added project existence check | Returns 404 if project not found before creating memory record |
| **Relevance scoring** | Enhanced scoring algorithm | `0.6 * embedding + 0.15 * keyword_hits + 0.10 * relevance_score` |

### 3.3 Implementation Details
- LLM prompt: "Answer using ONLY the institutional memory records provided below"
- Citations: Each memory record includes ID, discipline, date, summary, root_cause, resolution
- Multi-provider support: Tries provider based on `PRIMARY_LLM_PROVIDER` setting

---

## 4. Files Modified

| File | Changes |
|---|---|
| `backend/routers/evidence.py` | Added file persistence, metadata validation, GPS boundary checks, consistency scoring, audit records |
| `backend/routers/memory.py` | Added LLM-based RAG synthesis, fixed project_id, enhanced scoring, added logging |
| `backend/routers/field_capture.py` | Added input_mode validation, document ingestion endpoint, imports for parsing |
| `backend/requirements.txt` | Added pandas, openpyxl, pdfplumber, PyPDF2, python-docx, Pillow, numpy, google-generativeai |

---

## 5. Dependencies Added

```
pandas>=2.2.0          # Document data parsing (XLSX, CSV)
openpyxl>=3.1.2        # Excel file reading
pdfplumber>=0.11.0     # PDF text extraction
PyPDF2>=3.0.1          # PDF fallback parser
python-docx>=1.1.0     # DOCX file reading
Pillow>=10.2.0         # Image metadata handling
numpy>=1.26.0          # Numerical operations
google-generativeai>=0.4.0  # Gemini LLM for RAG
```

---

## 6. New Endpoints Added

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ingest/document` | Parse and ingest PDF/XLSX/CSV/DOCX reports |

---

## 7. Validation Plan

1. **Unit tests** — Evidence scoring functions, memory relevance calculation
2. **Integration tests** — Document ingestion end-to-end, evidence upload with file persistence
3. **Edge cases** — Empty files, unsupported types, GPS outside bounds, no LLM keys configured

---

## 8. Plan File Reference

- **Location:** `D:\Coding\Current-working\Nexus\plans\nexus-implementation-plan.md`