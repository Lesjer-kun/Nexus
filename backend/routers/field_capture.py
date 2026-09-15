"""
NEXUS - Module 2: Field Capture & Ingestion Pipeline Router
Endpoints:
  POST /api/events (and /events)
  GET /api/events (and /events)
  GET /api/events/{id} (and /events/{id})
"""

import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
import pandas as pd
from io import BytesIO

from config import settings
from database.db import get_db
from database.models import ExecutionEvent, Evidence, AuditRecord
from nlp.extractor import extract_activity_from_text, ExtractionError
from nlp.normalizer import normalize_event_fields
from nlp.validator import validate_event_dict
from matching.activity_matching import find_top_candidates, evaluate_governance_decision
from matching.embeddings import embed_text
from utils.serializers import serialize_event

router = APIRouter(tags=["Module 2: Field Capture & Ingestion Pipeline"])

class IngestEventRequest(BaseModel):
    text: str = Field(..., description="Natural language supervisor report or transcribed audio")
    input_mode: str = Field(default="voice", description="voice | text | document")
    source_filename: Optional[str] = Field(default="", description="Audio file or PDF source")
    project_id: int = Field(default=1)
    reporter_id: str = Field(default="SUP-017")
    reporter_name: Optional[str] = Field(default="Supervisor R. Bora")
    reporter_role: Optional[str] = Field(default="Lead Field Supervisor")
    audio_duration_seconds: Optional[float] = None
    evidence_list: List[Dict[str, Any]] = Field(default_factory=list)


def calculate_evidence_confidence(evidence_list: List[Dict[str, Any]]) -> float:
    """
    Calculates evidence provenance score from verifiable physical signals:
    - Photo / report file presence
    - Metadata validity (EXIF timestamp sanity)
    - GPS coordinates proximity & satellite fix accuracy (accuracy <= 5m)
    - Computer vision visual consistency score
    """
    if not evidence_list:
        return 0.45  # Baseline confidence for unverified claims without attached evidence

    scores = []
    for item in evidence_list:
        item_score = 0.0
        # 1. Visual consistency score (weight: 0.45)
        vc = float(item.get("visualConsistencyScore", 0.85))
        item_score += vc * 0.45

        # 2. Metadata / EXIF validity (weight: 0.25)
        if item.get("metadataValid", True):
            item_score += 0.25
        else:
            item_score += 0.10

        # 3. GPS satellite fix & site zone proximity (weight: 0.20)
        coords = item.get("gpsCoordinates")
        if coords and coords.get("lat") and coords.get("lng"):
            acc = float(coords.get("accuracyMeters", 5.0))
            if acc <= 5.0:
                item_score += 0.20
            else:
                item_score += 0.12
        else:
            item_score += 0.05

        # 4. File completeness & attribution (weight: 0.10)
        if item.get("fileName") and (item.get("fileUrl") or item.get("notes")):
            item_score += 0.10

        scores.append(min(0.99, item_score))

    avg_score = sum(scores) / len(scores)
    return round(avg_score, 2)


def generate_unique_event_number(db: Session) -> str:
    """
    Guarantees monotonic, collision-free sequential event numbers (e.g. EV-10501, EV-10502).
    """
    last_event = (
        db.query(ExecutionEvent)
        .filter(ExecutionEvent.event_number.like("EV-%"))
        .order_by(desc(ExecutionEvent.id))
        .first()
    )
    if last_event and last_event.event_number:
        try:
            num_part = int(last_event.event_number.replace("EV-", ""))
            next_num = num_part + 1
        except ValueError:
            next_num = 10500 + db.query(ExecutionEvent).count()
    else:
        next_num = 10500 + db.query(ExecutionEvent).count()

    candidate = f"EV-{next_num}"
    while db.query(ExecutionEvent).filter(ExecutionEvent.event_number == candidate).first():
        next_num += 1
        candidate = f"EV-{next_num}"
    return candidate


@router.post("/events")
def ingest_field_event(req: IngestEventRequest, db: Session = Depends(get_db)):
    """
    Step 1-7 End-to-End Ingestion Pipeline:
    Capture -> Pre-process -> AI Extract -> Normalize -> Match -> Audit -> Save
    Creates a verified, structured Execution Event in the database.
    """
    if req.input_mode not in ("voice", "text", "document"):
        raise HTTPException(status_code=422, detail="input_mode must be one of: voice, text, document")

    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Report text is required")

    # 1. AI Extraction
    try:
        extracted = extract_activity_from_text(
            raw_text=req.text,
            source_filename=req.source_filename or "",
            input_mode=req.input_mode,
            reporter_id=req.reporter_id,
            reporter_name=req.reporter_name or "Supervisor",
            reporter_role=req.reporter_role or "Lead Field Supervisor",
        )
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=f"Extraction failed: {e}")

    # 2. Normalization
    raw_dict = extracted.model_dump()
    normalized_dict, _ = normalize_event_fields(raw_dict)

    # 3. Deterministic Validation Gate
    is_valid, errors, warnings, action = validate_event_dict(normalized_dict)
    if action == "reject":
        raise HTTPException(
            status_code=422,
            detail={"message": "Event validation rejected", "errors": errors}
        )

    # 4. Semantic Schedule Matching (Retrieve + Score candidates)
    candidates = find_top_candidates(db, req.project_id, normalized_dict, top_k=3)
    gov_decision = evaluate_governance_decision(candidates)

    top_candidate = gov_decision.get("top_candidate")
    selected_act_id = int(top_candidate["activityId"]) if top_candidate else None
    matching_conf = gov_decision["mapping_confidence"]
    governance_status = gov_decision["governance_status"]
    if req.input_mode == "text" and governance_status == "NEEDS_CLARIFICATION":
        governance_status = "PENDING_REVIEW"

    # 5. Evidence Provenance & Number Generation
    evidence_conf = calculate_evidence_confidence(req.evidence_list)
    event_num = generate_unique_event_number(db)
    ev_embedding = embed_text(f"{normalized_dict.get('activity')} {normalized_dict.get('location') or ''}")

    ev = ExecutionEvent(
        project_id=req.project_id,
        event_number=event_num,
        reporter=req.reporter_id,
        reporter_name=req.reporter_name,
        reporter_role=req.reporter_role,
        raw_input=req.text,
        input_mode=req.input_mode,
        audio_duration_seconds=req.audio_duration_seconds,

        # Extracted fields
        event_type=normalized_dict.get("event_type"),
        activity_description=normalized_dict.get("activity"),
        location=normalized_dict.get("location"),
        date=normalized_dict.get("date"),
        status=normalized_dict.get("status"),
        quantity=normalized_dict.get("quantity"),
        quantity_unit=normalized_dict.get("unit"),
        quantity_raw=normalized_dict.get("quantity_raw"),
        blocker=normalized_dict.get("blocker"),
        expected_resumption=normalized_dict.get("expected_resumption"),
        start_time=normalized_dict.get("start_time"),
        end_time=normalized_dict.get("end_time"),
        notes=normalized_dict.get("notes") or f"Ingested via {req.input_mode} interface.",
        source=req.source_filename,

        # Schedule linking & Governance
        matching_confidence=matching_conf,
        evidence_confidence=evidence_conf,
        candidate_matches=candidates,
        selected_activity_id=selected_act_id,
        governance_status=governance_status,

        embedding=ev_embedding,
    )
    db.add(ev)
    db.flush()

    # 6. Save attached Evidence records
    for evid in req.evidence_list:
        coords = evid.get("gpsCoordinates") or {}
        evidence_rec = Evidence(
            event_id=ev.id,
            file_name=evid.get("fileName", "evidence.jpg"),
            file_type=evid.get("fileType", "photo"),
            file_url=evid.get("fileUrl", ""),
            uploader_id=evid.get("uploaderId", req.reporter_id),
            uploader_name=evid.get("uploaderName", req.reporter_name or "Supervisor"),
            gps_lat=coords.get("lat"),
            gps_lng=coords.get("lng"),
            site_zone=coords.get("siteZone"),
            accuracy_meters=coords.get("accuracyMeters", 3.0),
            metadata_valid=evid.get("metadataValid", True),
            visual_consistency_score=evid.get("visualConsistencyScore", 0.92),
            notes=evid.get("notes", ""),
        )
        db.add(evidence_rec)

    # 7. Immutable Audit Log (Pipeline Step 7)
    evidence_hash = hashlib.sha256(f"{ev.event_number}:{req.text}:{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()
    audit_rec = AuditRecord(
        entity_type="ExecutionEvent",
        entity_id=ev.event_number,
        actor_id=req.reporter_id,
        actor_name=req.reporter_name or "Supervisor",
        actor_role="Field Submission",
        action="INGEST_FIELD_EVENT",
        before_state=None,
        after_state={
            "rawInput": req.text,
            "matchedActivity": top_candidate.get("wbsCode") if top_candidate else "UNASSIGNED",
            "confidence": matching_conf,
            "governanceStatus": ev.governance_status,
        },
        rationale=f"Field report ingested via {req.input_mode}. Matched to {top_candidate.get('wbsCode') if top_candidate else 'None'} with {int(matching_conf*100)}% confidence.",
        evidence_hash=f"sha256:{evidence_hash[:32]}",
    )
    db.add(audit_rec)

    db.commit()
    db.refresh(ev)

    return serialize_event(ev)


@router.get("/events")
def list_execution_events(
    project_id: int = Query(1),
    governance_status: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns list of Execution Events ordered by creation time descending.
    Matches frontend apiClient.getEvents() and apiClient.getPendingReviews().
    """
    stmt = db.query(ExecutionEvent).filter(ExecutionEvent.project_id == project_id)

    if governance_status:
        stmt = stmt.filter(ExecutionEvent.governance_status == governance_status)
    if status:
        stmt = stmt.filter(ExecutionEvent.status == status)

    events = stmt.order_by(desc(ExecutionEvent.created_at)).all()
    return [serialize_event(e) for e in events]


@router.get("/events/{id}")
def get_execution_event_by_id(id: str, db: Session = Depends(get_db)):
    """
    Retrieves single Execution Event by numeric ID or event_number (e.g. EV-10492).
    """
    if id.isdigit():
        event = db.query(ExecutionEvent).filter(ExecutionEvent.id == int(id)).first()
    else:
        event = db.query(ExecutionEvent).filter(ExecutionEvent.event_number == id).first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Execution event {id} not found")

    return serialize_event(event)


@router.post("/ingest/document")
async def ingest_document(
    project_id: int = Form(...),
    reporter_id: str = Form("SUP-017"),
    reporter_name: Optional[str] = Form("Supervisor R. Bora"),
    reporter_role: Optional[str] = Form("Lead Field Supervisor"),
    file: UploadFile = File(...),
    evidence_list: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Ingest a document (PDF, XLSX, CSV, DOCX) as a field report.
    Parses text from supported formats and runs it through the full ingestion pipeline.
    """
    import json as _json
    evidence_list_parsed: List[Dict[str, Any]] = []
    if evidence_list:
        try:
            evidence_list_parsed = _json.loads(evidence_list)
        except (_json.JSONDecodeError, TypeError):
            evidence_list_parsed = []

    allowed_content_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/csv",
        "text/plain",
    }
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, XLSX, CSV, DOCX, TXT",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")

    filename_original = file.filename or "document_upload"
    text_content = ""

    try:
        if file.content_type == "text/csv":
            from io import StringIO
            import csv as csv_module
            reader = csv_module.DictReader(StringIO(content.decode("utf-8", errors="replace")))
            rows = list(reader)
            if rows:
                text_content = " | ".join(
                    " | ".join(f"{k}: {v}" for k, v in row.items()) for row in rows[:10]
                )
        elif file.content_type in {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"}:
            from openpyxl import load_workbook
            from io import BytesIO as BIO
            workbook = load_workbook(filename=BIO(content), read_only=True, data_only=True)
            sheet = workbook.active
            rows_data = []
            for row in sheet.iter_rows(values_only=True):
                rows_data.append([str(cell) for cell in row if cell is not None])
            text_content = "\n".join(" | ".join(r) for r in rows_data[:20])
            workbook.close()
        elif file.content_type == "application/pdf":
            try:
                import pdfplumber
                from io import BytesIO as BIO
                with pdfplumber.open(BIO(content)) as pdf:
                    for page in pdf.pages[:10]:
                        extracted = page.extract_text()
                        if extracted:
                            text_content += extracted + "\n"
            except ImportError:
                try:
                    import PyPDF2
                    from io import BytesIO as BIO
                    reader = PyPDF2.PdfReader(BIO(content))
                    for page in reader.pages[:10]:
                        text_content += page.extract_text() + "\n"
                except ImportError:
                    raise ValueError("No PDF parsing library available. Install pdfplumber or PyPDF2.")
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            from docx import Document
            from io import BytesIO as BIO
            doc = Document(BIO(content))
            text_content = "\n".join(paragraph.text for paragraph in doc.paragraphs)
        elif file.content_type == "text/plain":
            text_content = content.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Document parsing failed: {e}")

    if not text_content.strip():
        raise HTTPException(status_code=422, detail="No extractable text content found in document")

    req = IngestEventRequest(
        text=text_content,
        input_mode="document",
        source_filename=filename_original,
        project_id=project_id,
        reporter_id=reporter_id,
        reporter_name=reporter_name or "Supervisor R. Bora",
        reporter_role=reporter_role or "Lead Field Supervisor",
        evidence_list=evidence_list_parsed,
    )

    if req.input_mode not in ("voice", "text", "document"):
        raise HTTPException(status_code=422, detail="input_mode must be one of: voice, text, document")

    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Report text is required")

    try:
        extracted = extract_activity_from_text(
            raw_text=req.text,
            source_filename=req.source_filename or "",
            input_mode=req.input_mode,
            reporter_id=req.reporter_id,
            reporter_name=req.reporter_name or "Supervisor",
            reporter_role=req.reporter_role or "Lead Field Supervisor",
        )
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=f"Extraction failed: {e}")

    raw_dict = extracted.model_dump()
    normalized_dict, _ = normalize_event_fields(raw_dict)

    is_valid, errors, warnings, action = validate_event_dict(normalized_dict)
    if action == "reject":
        raise HTTPException(
            status_code=422,
            detail={"message": "Event validation rejected", "errors": errors}
        )

    candidates = find_top_candidates(db, req.project_id, normalized_dict, top_k=3)
    gov_decision = evaluate_governance_decision(candidates)

    top_candidate = gov_decision.get("top_candidate")
    selected_act_id = int(top_candidate["activityId"]) if top_candidate else None
    matching_conf = gov_decision["mapping_confidence"]

    evidence_conf = calculate_evidence_confidence(req.evidence_list)
    event_num = generate_unique_event_number(db)
    ev_embedding = embed_text(f"{normalized_dict.get('activity')} {normalized_dict.get('location') or ''}")

    ev = ExecutionEvent(
        project_id=req.project_id,
        event_number=event_num,
        reporter=req.reporter_id,
        reporter_name=req.reporter_name,
        reporter_role=req.reporter_role,
        raw_input=req.text,
        input_mode=req.input_mode,
        audio_duration_seconds=req.audio_duration_seconds,

        event_type=normalized_dict.get("event_type"),
        activity_description=normalized_dict.get("activity"),
        location=normalized_dict.get("location"),
        date=normalized_dict.get("date"),
        status=normalized_dict.get("status"),
        quantity=normalized_dict.get("quantity"),
        quantity_unit=normalized_dict.get("unit"),
        quantity_raw=normalized_dict.get("quantity_raw"),
        blocker=normalized_dict.get("blocker"),
        expected_resumption=normalized_dict.get("expected_resumption"),
        start_time=normalized_dict.get("start_time"),
        end_time=normalized_dict.get("end_time"),
        notes=normalized_dict.get("notes") or f"Ingested via {req.input_mode} interface.",
        source=req.source_filename,

        matching_confidence=matching_conf,
        evidence_confidence=evidence_conf,
        candidate_matches=candidates,
        selected_activity_id=selected_act_id,
        governance_status=gov_decision["governance_status"],

        embedding=ev_embedding,
    )
    db.add(ev)
    db.flush()

    for evid in req.evidence_list:
        coords = evid.get("gpsCoordinates") or {}
        evidence_rec = Evidence(
            event_id=ev.id,
            file_name=evid.get("fileName", "evidence.jpg"),
            file_type=evid.get("fileType", "report_pdf"),
            file_url=evid.get("fileUrl", ""),
            uploader_id=evid.get("uploaderId", req.reporter_id),
            uploader_name=evid.get("uploaderName", req.reporter_name or "Supervisor"),
            gps_lat=coords.get("lat"),
            gps_lng=coords.get("lng"),
            site_zone=coords.get("siteZone"),
            accuracy_meters=coords.get("accuracyMeters", 3.0),
            metadata_valid=evid.get("metadataValid", True),
            visual_consistency_score=evid.get("visualConsistencyScore", 0.92),
            notes=evid.get("notes", ""),
        )
        db.add(evidence_rec)

    evidence_hash = hashlib.sha256(f"{ev.event_number}:{req.text}:{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()
    audit_rec = AuditRecord(
        entity_type="ExecutionEvent",
        entity_id=ev.event_number,
        actor_id=req.reporter_id,
        actor_name=req.reporter_name or "Supervisor",
        actor_role="Field Submission",
        action="INGEST_DOCUMENT_REPORT",
        before_state=None,
        after_state={
            "rawInput": req.text,
            "matchedActivity": top_candidate.get("wbsCode") if top_candidate else "UNASSIGNED",
            "confidence": matching_conf,
            "governanceStatus": ev.governance_status,
        },
        rationale=f"Document report ingested. Matched to {top_candidate.get('wbsCode') if top_candidate else 'None'} with {int(matching_conf*100)}% confidence.",
        evidence_hash=f"sha256:{evidence_hash[:32]}",
    )
    db.add(audit_rec)

    db.commit()
    db.refresh(ev)

    return serialize_event(ev)
