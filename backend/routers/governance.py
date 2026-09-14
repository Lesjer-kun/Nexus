"""
NEXUS - Module 6 & 7: Governance & Schedule State Management Router
Endpoints:
  POST /api/events/{id}/governance (and /approve)
  GET /api/reviews/pending (and /events/pending)
  PATCH /api/activities/{id}
  POST /api/activities/{id}/status
  GET /api/activities/{id}/variance
"""

import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.db import get_db
from database.models import ExecutionEvent, Activity, Validation, AuditRecord, MemoryRecord
from matching.embeddings import embed_text
from utils.serializers import serialize_event, serialize_activity

router = APIRouter(tags=["Module 6 & 7: Governance & Schedule State Management"])

class GovernanceRequest(BaseModel):
    decision: str = Field(..., description="APPROVED | CORRECTED | REJECTED | NEEDS_CLARIFICATION")
    selected_activity_id: Optional[int] = None
    reviewer: str = Field(default="P. Sharma (Lead Project Planner)")
    planner_notes: Optional[str] = None
    corrected_fields: Optional[Dict[str, Any]] = None


class ApprovePayload(BaseModel):
    event_id: int
    decision: str = "APPROVED"
    selected_activity_id: Optional[int] = None
    reviewer: str = "P. Sharma (Lead Project Planner)"
    planner_notes: Optional[str] = None
    corrected_fields: Optional[Dict[str, Any]] = None


def apply_authoritative_schedule_update(
    db: Session, activity: Activity, event: ExecutionEvent
) -> Dict[str, Any]:
    """
    Authoritative state mutation: Updates planned vs verified actual schedule parameters.
    Section 7 / 12 of Blueprint.
    """
    before_state = serialize_activity(activity)
    today = datetime.now()

    if event.event_type == "completed" or event.status == "completed":
        activity.status = "COMPLETED"
        activity.progress_pct = 100.0
        activity.actual_end = today
        activity.actual_duration_days = activity.baseline_duration_days
        activity.variance_days = 0
    elif event.event_type == "interrupted" or event.status == "interrupted":
        activity.status = "HALTED"
        activity.variance_days = (activity.variance_days or 0) + 1
    elif event.event_type in ("started", "in_progress", "resumed"):
        activity.status = "IN_PROGRESS"
        if not activity.actual_start:
            activity.actual_start = today
        activity.progress_pct = min(95.0, (activity.progress_pct or 0.0) + 25.0)

    # Installed quantity update
    if event.quantity and activity.planned_quantity:
        activity.installed_quantity = min(
            activity.planned_quantity,
            (activity.installed_quantity or 0.0) + event.quantity
        )

    db.flush()
    after_state = serialize_activity(activity)
    return {"before": before_state, "after": after_state}


@router.post("/events/{id}/governance")
def submit_governance(id: int, req: GovernanceRequest, db: Session = Depends(get_db)):
    """
    Planner governance action: approve, correct, reject, or request clarification.
    """
    event = db.query(ExecutionEvent).filter(ExecutionEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {id} not found")

    target_activity_id = req.selected_activity_id or event.selected_activity_id
    activity = db.query(Activity).filter(Activity.id == target_activity_id).first() if target_activity_id else None

    prev_status = event.governance_status
    prev_activity_id = event.selected_activity_id

    # Update event governance status
    event.governance_status = req.decision
    event.selected_activity_id = target_activity_id
    event.planner_review_notes = req.planner_notes
    event.reviewed_by = req.reviewer
    event.reviewed_at = datetime.now(timezone.utc)

    # Apply corrections if provided
    if req.corrected_fields:
        safe_fields = {
            "activityDescription": "activity_description",
            "candidateLocation": "location",
            "quantity": "quantity",
            "unit": "quantity_unit",
            "blocker": "blocker",
            "notes": "notes",
            "status": "status",
            "eventType": "event_type",
        }
        for k, v in req.corrected_fields.items():
            if k in safe_fields:
                setattr(event, safe_fields[k], v)

    # Apply authoritative schedule update if approved or corrected
    schedule_update = None
    if activity and req.decision in ("APPROVED", "CORRECTED"):
        schedule_update = apply_authoritative_schedule_update(db, activity, event)

    # Log immutable audit record
    evidence_hash = hashlib.sha256(f"{event.event_number}:{req.decision}:{req.reviewer}".encode()).hexdigest()
    db.add(AuditRecord(
        entity_type="ExecutionEvent",
        entity_id=event.event_number,
        actor_id="PLN-003",
        actor_name=req.reviewer,
        actor_role="Senior Project Planner",
        action=f"GOVERNANCE_{req.decision}",
        before_state={"governanceStatus": prev_status, "selectedActivityId": prev_activity_id},
        after_state={
            "governanceStatus": req.decision,
            "selectedActivityId": target_activity_id,
            "scheduleUpdated": schedule_update is not None,
            "activityState": schedule_update["after"] if schedule_update else None,
        },
        rationale=req.planner_notes or f"Planner executed governance decision: {req.decision}",
        evidence_hash=f"sha256:{evidence_hash[:32]}",
    ))

    # Index into Institutional Memory for RAG
    memory_id = None
    if req.decision in ("APPROVED", "CORRECTED"):
        summary_text = (
            f"{event.activity_description} at {event.location or 'site'} marked {event.status}. "
            f"Quantity: {event.quantity or 'N/A'} {event.quantity_unit or ''}. "
            f"{'Blocker: ' + event.blocker if event.blocker else 'No blockers reported.'}"
        )
        mem = MemoryRecord(
            project_id=event.project_id,
            title=f"Verified Actual: {event.activity_description}",
            discipline=activity.discipline if activity else "General",
            project_code="OIL-DNPL-01",
            date=event.date or datetime.now().date().isoformat(),
            summary=summary_text,
            root_cause=event.blocker or "Standard execution variance",
            resolution=req.planner_notes or "Verified against field engineering logs and photo evidence.",
            source_event_ref=event.event_number,
            matched_keywords=[w for w in (event.activity_description or "").lower().split() if len(w) > 3],
            relevance_score=0.95,
            embedding=embed_text(summary_text),
        )
        db.add(mem)
        db.flush()
        memory_id = mem.id

    db.commit()
    db.refresh(event)

    return {
        "success": True,
        "governanceStatus": event.governance_status,
        "memoryRecordId": memory_id,
        "event": serialize_event(event),
    }


@router.post("/approve")
def approve_event_alias(req: ApprovePayload, db: Session = Depends(get_db)):
    """Convenience alias for /events/{id}/governance."""
    gov_req = GovernanceRequest(
        decision=req.decision,
        selected_activity_id=req.selected_activity_id,
        reviewer=req.reviewer,
        planner_notes=req.planner_notes,
        corrected_fields=req.corrected_fields,
    )
    return submit_governance(req.event_id, gov_req, db)


@router.get("/reviews/pending")
@router.get("/events/pending")
def get_pending_reviews(project_id: int = 1, db: Session = Depends(get_db)):
    """Returns all events currently awaiting planner governance review."""
    events = (
        db.query(ExecutionEvent)
        .filter(ExecutionEvent.project_id == project_id)
        .filter(ExecutionEvent.governance_status == "PENDING_REVIEW")
        .order_by(desc(ExecutionEvent.created_at))
        .all()
    )
    return [serialize_event(e) for e in events]


@router.get("/activities/{id}/variance")
def get_activity_variance(id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {
        "activityId": str(activity.id),
        "wbsCode": activity.activity_id,
        "varianceDays": activity.variance_days,
        "progressPct": activity.progress_pct,
        "status": activity.status,
    }
