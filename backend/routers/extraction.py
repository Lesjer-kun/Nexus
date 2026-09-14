"""
NEXUS - Module 3: AI Extraction & NLP Pipeline Router
Endpoints:
  POST /api/extract (and /extract)
  POST /api/extract/normalize (and /extract/normalize)
  POST /api/extract/validate (and /extract/validate)
  POST /api/extract/transcribe (and /extract/transcribe)
"""

import os
import shutil
import tempfile
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from nlp.schema import (
    ExtractionRequest, NormalizationRequest, NormalizationResponse,
    ValidationRequest, ValidationResponse,
)
from nlp.extractor import extract_activity_from_text, ExtractionError
from nlp.normalizer import normalize_event_fields
from nlp.validator import validate_event_dict
from nlp.speech import transcribe_audio_file

router = APIRouter(tags=["Module 3: AI Extraction & NLP Pipeline"])


@router.post("/extract")
def extract_field_report(req: ExtractionRequest):
    """
    Extracts structured execution fields from unstructured natural language text or voice notes.
    Constrained schema prevents LLM hallucinations by enforcing explicit nulls.
    """
    try:
        raw_event = extract_activity_from_text(
            raw_text=req.text,
            source_filename=req.source_filename or "",
            input_mode=req.input_mode,
            reporter_id=req.reporter_id,
            reporter_name=req.reporter_name or "Supervisor",
            reporter_role=req.reporter_role or "Lead Field Supervisor",
        )
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Pipeline Step 4: Normalization
    event_dict = raw_event.model_dump()
    normalized_dict, changes = normalize_event_fields(event_dict)

    # Pipeline Step 5: Deterministic Validation Gate
    is_valid, errors, warnings, action = validate_event_dict(normalized_dict)

    return {
        "success": is_valid,
        "action": action,
        "extracted": normalized_dict,
        "normalizationChanges": changes,
        "validation": {
            "isValid": is_valid,
            "action": action,
            "errors": errors,
            "warnings": warnings,
        },
    }


@router.post("/extract/normalize", response_model=NormalizationResponse)
def normalize_event_data(req: NormalizationRequest):
    """
    Step 4: Normalizes site slang, colloquial terms, units, dates, and times
    into controlled construction vocabulary.
    """
    normalized, changes = normalize_event_fields(req.event_data)
    return NormalizationResponse(normalized_data=normalized, changes_made=changes)


@router.post("/extract/validate", response_model=ValidationResponse)
def validate_event_data(req: ValidationRequest):
    """
    Step 5: Deterministic validation of extracted schema against business rules.
    Verifies required activity, progress bounds, date ISO integrity, and status sanity.
    """
    is_valid, errors, warnings, action = validate_event_dict(req.event_data)
    return ValidationResponse(
        is_valid=is_valid,
        action=action,
        reason=errors[0] if errors else (warnings[0] if warnings else "Validation passed"),
        errors=errors,
        warnings=warnings,
        sanitized_event=req.event_data,
    )


@router.post("/extract/transcribe")
async def transcribe_voice_audio(
    file: UploadFile = File(...),
):
    """
    Converts uploaded voice audio reports from site supervisors to text.
    """
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = transcribe_audio_file(tmp_path, filename=file.filename or "")
        return {
            "success": True,
            "filename": file.filename,
            "text": result["text"],
            "confidence": result["confidence"],
            "provider": result["provider"],
        }
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
