"""
NEXUS - Module 5: Evidence & Provenance Service Router
Endpoints:
  POST /api/evidence/upload
  GET /api/evidence/{id}
  POST /api/evidence/{id}/verify
"""

import os
import hashlib
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import Evidence, ExecutionEvent
from utils.serializers import serialize_evidence

router = APIRouter(tags=["Module 5: Evidence & Provenance Service"])

class VerifyEvidenceRequest(BaseModel):
    is_valid: bool = True
    consistency_score: float = 0.95
    notes: Optional[str] = None


@router.post("/evidence/upload")
async def upload_evidence(
    event_id: int = Form(...),
    uploader_id: str = Form("SUP-017"),
    uploader_name: str = Form("Supervisor"),
    file_type: str = Form("photo"),
    gps_lat: Optional[float] = Form(27.3482),
    gps_lng: Optional[float] = Form(95.3219),
    site_zone: Optional[str] = Form("Zone A"),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    event = db.query(ExecutionEvent).filter(ExecutionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Execution event not found")

    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    evidence = Evidence(
        event_id=event.id,
        file_name=file.filename or "uploaded_evidence.jpg",
        file_type=file_type,
        file_url=f"/uploads/{file.filename}",
        uploader_id=uploader_id,
        uploader_name=uploader_name,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        site_zone=site_zone,
        metadata_valid=True,
        visual_consistency_score=0.94,
        evidence_hash=f"sha256:{file_hash}",
        notes=notes or "Uploaded via NEXUS Field Interface.",
    )
    db.add(evidence)
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

    evid.metadata_valid = req.is_valid
    evid.visual_consistency_score = req.consistency_score
    if req.notes:
        evid.notes = f"{evid.notes or ''} [Verification: {req.notes}]".strip()

    db.commit()
    db.refresh(evid)
    return serialize_evidence(evid)
