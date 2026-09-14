"""
NEXUS - Model Serializers
Translates SQLAlchemy ORM instances into the exact JSON shapes defined in the frontend
types/nexus.ts (ProjectInfo, ScheduleActivity, ExecutionEvent, CandidateMatch, AuditLogRecord).
"""

from typing import Dict, Any, List, Optional
from app.database.models import (
    Project, Activity, ExecutionEvent, Evidence, AuditRecord, MemoryRecord
)

def serialize_activity(a: Activity) -> Dict[str, Any]:
    return {
        "id": str(a.id),
        "wbsCode": a.activity_id,
        "name": a.name,
        "discipline": a.discipline,
        "location": a.location,
        "equipmentTag": a.equipment_tag or "",
        "plannedStart": a.planned_start.isoformat() if a.planned_start else "",
        "plannedEnd": a.planned_end.isoformat() if a.planned_end else "",
        "actualStart": a.actual_start.isoformat().split("T")[0] if a.actual_start else None,
        "actualEnd": a.actual_end.isoformat().split("T")[0] if a.actual_end else None,
        "baselineDurationDays": a.baseline_duration_days,
        "actualDurationDays": a.actual_duration_days,
        "progressPct": a.progress_pct or 0.0,
        "isCriticalPath": bool(a.is_critical_path),
        "predecessorIds": [str(p) for p in (a.dependencies or [])],
        "status": a.status or "NOT_STARTED",
        "varianceDays": a.variance_days or 0,
        "unitOfMeasure": a.unit_of_measure,
        "plannedQuantity": a.planned_quantity,
        "installedQuantity": a.installed_quantity or 0.0,
    }


def serialize_evidence(e: Evidence) -> Dict[str, Any]:
    return {
        "id": str(e.id),
        "eventId": str(e.event_id),
        "fileName": e.file_name,
        "fileType": e.file_type or "photo",
        "fileUrl": e.file_url or "",
        "uploaderId": e.uploader_id,
        "uploaderName": e.uploader_name or "Supervisor",
        "timestamp": e.timestamp.isoformat() if e.timestamp else "",
        "gpsCoordinates": {
            "lat": e.gps_lat or 27.3482,
            "lng": e.gps_lng or 95.3219,
            "siteZone": e.site_zone or "Zone A",
            "accuracyMeters": e.accuracy_meters or 3.0,
        } if e.gps_lat else None,
        "metadataValid": bool(e.metadata_valid),
        "visualConsistencyScore": e.visual_consistency_score or 0.90,
        "notes": e.notes,
    }


def serialize_event(e: ExecutionEvent) -> Dict[str, Any]:
    evidence_list = [serialize_evidence(ev) for ev in (e.evidence_items or [])]
    return {
        "id": str(e.id),
        "eventNumber": e.event_number,
        "reporterId": e.reporter,
        "reporterName": e.reporter_name or "Field Supervisor",
        "reporterRole": e.reporter_role or "Lead Field Supervisor",
        "rawInput": e.raw_input or "",
        "inputMode": e.input_mode or "text",
        "audioDurationSeconds": e.audio_duration_seconds,
        "createdAt": e.created_at.isoformat() if e.created_at else "",

        # Extracted constrained schema
        "eventType": e.event_type,
        "activityDescription": e.activity_description,
        "candidateLocation": e.location,
        "startTime": e.start_time,
        "endTime": e.end_time,
        "status": e.status,
        "quantity": e.quantity,
        "unit": e.quantity_unit,
        "blocker": e.blocker,
        "expectedResumption": e.expected_resumption,
        "evidenceReferences": [ev["fileName"] for ev in evidence_list] if evidence_list else [],
        "notes": e.notes,

        # Schedule linking & governance
        "matchingConfidence": round(e.matching_confidence, 2) if e.matching_confidence is not None else 0.0,
        "evidenceConfidence": round(e.evidence_confidence, 2) if e.evidence_confidence is not None else 0.45,
        "candidateMatches": e.candidate_matches or [],
        "selectedActivityId": str(e.selected_activity_id) if e.selected_activity_id else None,
        "governanceStatus": e.governance_status or "PENDING_REVIEW",
        "plannerReviewNotes": e.planner_review_notes,
        "reviewedBy": e.reviewed_by,
        "reviewedAt": e.reviewed_at.isoformat() if e.reviewed_at else None,

        "evidenceList": evidence_list,
    }


def serialize_project(p: Project, activities: List[Activity]) -> Dict[str, Any]:
    total = len(activities)
    completed = sum(1 for a in activities if a.status == "COMPLETED")
    delayed = sum(1 for a in activities if (a.variance_days or 0) > 0)
    avg_progress = (
        round(sum(a.progress_pct or 0.0 for a in activities) / total, 1) if total > 0 else 0.0
    )
    return {
        "id": str(p.id),
        "code": p.code,
        "name": p.name,
        "client": p.client,
        "location": p.location,
        "baselineVersion": p.baseline_version,
        "totalActivities": total,
        "completedActivities": completed,
        "delayedActivities": delayed,
        "overallProgressPct": avg_progress,
    }


def serialize_audit(a: AuditRecord) -> Dict[str, Any]:
    return {
        "id": str(a.id),
        "timestamp": a.timestamp.isoformat() if a.timestamp else "",
        "actorId": a.actor_id,
        "actorName": a.actor_name or a.actor_id,
        "actorRole": a.actor_role or "Auditor",
        "action": a.action,
        "targetEntity": a.entity_type,
        "entityId": a.entity_id,
        "beforeState": a.before_state,
        "afterState": a.after_state or {},
        "rationale": a.rationale or "",
        "evidenceHash": a.evidence_hash or "",
    }


def serialize_memory(m: MemoryRecord) -> Dict[str, Any]:
    return {
        "id": str(m.id),
        "title": m.title,
        "projectCode": m.project_code,
        "discipline": m.discipline,
        "date": m.date,
        "summary": m.summary,
        "rootCause": m.root_cause,
        "resolution": m.resolution,
        "relevanceScore": m.relevance_score or 0.95,
        "sourceEventRef": m.source_event_ref,
        "matchedKeywords": m.matched_keywords or [],
    }
