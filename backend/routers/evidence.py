"""
NEXUS - Module 5: Evidence & Provenance Service Router
Endpoints:
  POST /api/evidence/upload
  GET /api/evidence/{id}
  POST /api/evidence/{id}/verify
"""

import os
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import Evidence, ExecutionEvent, AuditRecord
from utils.serializers import serialize_evidence
from config import settings

router = APIRouter(tags=["Module 5: Evidence & Provenance Service"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Project site bounds for Duliajan-Numaligarh, Assam
SITE_BOUNDS = {
    "lat_min": 27.0, "lat_max": 27.8,
    "lng_min": 95.0, "lng_max": 95.8,
}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff"}
ALLOWED_DOC_TYPES = {"application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/csv"}
ALLOWED_FILE_TYPES = {"photo", "report_pdf", "timesheet", "document", "video"}

class VerifyEvidenceRequest(BaseModel):
    is_valid: bool = True
    consistency_score: float = 0.95
    notes: Optional[str] = None


def compute_visual_consistency(ev: Evidence, file_content: bytes) -> float:
    """Deterministic visual consistency score based on file properties and metadata."""
    score = 0.70

    if ev.file_type == "photo":
        if len(file_content) < 1024:
            score -= 0.25
        elif len(file_content) > 500_000:
            score += 0.05
        else:
            score += 0.05

        if ev.gps_lat is not None and ev.gps_lng is not None:
            in_bounds = (SITE_BOUNDS["lat_min"] <= ev.gps_lat <= SITE_BOUNDS["lat_max"] and
                         SITE_BOUNDS["lng_min"] <= ev.gps_lng <= SITE_BOUNDS["lng_max"])
            score += 0.10 if in_bounds else -0.15

        if ev.accuracy_meters is not None and ev.accuracy_meters <= 10.0:
            score += 0.10
        elif ev.accuracy_meters is not None and ev.accuracy_meters <= 50.0:
            score += 0.05

    elif ev.file_type == "report_pdf":
        if len(file_content) > 5000:
            score += 0.10
        else:
            score -= 0.10

    if ev.metadata_valid:
        score += 0.15
    else:
        score -= 0.10

    return round(max(0.0, min(0.99, score)), 2)


def compute_metadata_validity(ev: Evidence) -> bool:
    """Validate metadata plausibility."""
    if ev.file_type == "photo":
        if ev.gps_lat is not None and not (SITE_BOUNDS["lat_min"] <= ev.gps_lat <= SITE_BOUNDS["lat_max"]):
            return False
        if ev.gps_lng is not None and not (SITE_BOUNDS["lng_min"] <= ev.gps_lng <= SITE_BOUNDS["lng_max"]):
            return False
        if ev.accuracy_meters is not None and ev.accuracy_meters > 1000:
            return False
    return True


@router.post("/evidence/upload")
async def upload_evidence(
    event_id: int = Form(...),
    uploader_id: str = Form("SUP-017"),
    uploader_name: str = Form("Supervisor"),
    file_type: str = Form("photo"),
    gps_lat: Optional[float] = Form(None),
    gps_lng: Optional[float] = Form(None),
    site_zone: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    event = db.query(ExecutionEvent).filter(ExecutionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Execution event not found")

    if file_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid file_type '{file_type}'. Allowed: {ALLOWED_FILE_TYPES}")

    if file_type == "photo" and file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid image type '{file.content_type}' for photo evidence")

    if file_type == "report_pdf" and file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid document type '{file.content_type}' for report_pdf")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")

    file_hash = hashlib.sha256(content).hexdigest()

    safe_filename = f"{event_id}_{file_hash[:12]}_{file.filename}" if file.filename else f"{event_id}_{file_hash[:12]}"
    file_path = UPLOAD_DIR / safe_filename
    file_path.write_bytes(content)

    evidence = Evidence(
        event_id=event.id,
        file_name=file.filename or safe_filename,
        file_type=file_type,
        file_url=f"/uploads/{safe_filename}",
        uploader_id=uploader_id,
        uploader_name=uploader_name,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        site_zone=site_zone,
        metadata_valid=True,
        visual_consistency_score=0.90,
        evidence_hash=f"sha256:{file_hash}",
        notes=notes or "Uploaded via NEXUS Field Interface.",
    )

    evidence.metadata_valid = compute_metadata_validity(evidence)
    evidence.visual_consistency_score = compute_visual_consistency(evidence, content)

    db.add(evidence)
    db.flush()

    evidence_hash = hashlib.sha256(f"{evidence.id}:{file_hash}:{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()
    db.add(AuditRecord(
        entity_type="Evidence",
        entity_id=str(evidence.id),
        actor_id=uploader_id,
        actor_name=uploader_name,
        actor_role="Field Supervisor",
        action="EVIDENCE_UPLOAD",
        before_state=None,
        after_state={
            "fileName": evidence.file_name,
            "fileType": evidence.file_type,
            "fileUrl": evidence.file_url,
            "evidenceHash": evidence.evidence_hash,
            "gpsLat": evidence.gps_lat,
            "gpsLng": evidence.gps_lng,
            "metadataValid": evidence.metadata_valid,
            "visualConsistencyScore": evidence.visual_consistency_score,
        },
        rationale=f"Evidence file uploaded for event {event.event_number}. Hash: {evidence.evidence_hash[:16]}...",
        evidence_hash=f"sha256:{evidence_hash[:32]}",
    ))

    db.commit()
    db.refresh(evidence)
    return serialize_evidence(evidence)


@router.get("/evidence/{id}")
def get_evidence(id: int, db: Session = Depends(get_db)):
    evid = db.query(Evidence).filter(Evidence.id == id).first()
    if not evid:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    return serialize_evidence(evid)


@router.post("/evidence/{id}/verify")
def verify_evidence(id: int, req: VerifyEvidenceRequest, db: Session = Depends(get_db)):
    evid = db.query(Evidence).filter(Evidence.id == id).first()
    if not evid:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    before_state = {
        "metadataValid": evid.metadata_valid,
        "visualConsistencyScore": evid.visual_consistency_score,
        "notes": evid.notes,
    }

    evid.metadata_valid = req.is_valid
    evid.visual_consistency_score = req.consistency_score
    if req.notes:
        evid.notes = f"{evid.notes or ''} [Verification: {req.notes}]".strip()

    evidence_hash = hashlib.sha256(f"{evid.id}:{req.is_valid}:{req.consistency_score}".encode()).hexdigest()
    db.add(AuditRecord(
        entity_type="Evidence",
        entity_id=str(evid.id),
        actor_id="PLN-003",
        actor_name="Lead Project Planner",
        actor_role="Planner",
        action="EVIDENCE_VERIFY",
        before_state=before_state,
        after_state={
            "metadataValid": evid.metadata_valid,
            "visualConsistencyScore": evid.visual_consistency_score,
            "notes": evid.notes,
        },
        rationale=f"Evidence verified: valid={req.is_valid}, score={req.consistency_score}",
        evidence_hash=f"sha256:{evidence_hash[:32]}",
    ))

    db.commit()
    db.refresh(evid)
    return serialize_evidence(evid)
