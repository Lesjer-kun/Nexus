"""
NEXUS - Matcher Service Orchestration
Connects database queries, embedding retrieval, scoring breakdown, and candidate selection.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database.models import ExecutionEvent, Activity, MatchDecision, AuditRecord
from matching.activity_matching import (
    find_top_candidates,
    score_activity_candidate,
    evaluate_governance_decision,
)
from matching.embeddings import embed_text

def get_candidates_for_event(
    db: Session, event_id: int, top_k: int = 3
) -> Dict[str, Any]:
    event = db.query(ExecutionEvent).filter(ExecutionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Execution event {event_id} not found")

    ev_dict = {
        "activity": event.activity_description,
        "location": event.location,
        "date": event.date,
        "status": event.status,
        "raw_input": event.raw_input,
        "notes": event.notes,
    }

    candidates = find_top_candidates(db, event.project_id, ev_dict, top_k=top_k)
    decision = evaluate_governance_decision(candidates)

    # Cache on event model
    event.candidate_matches = candidates
    event.matching_confidence = decision["mapping_confidence"]
    if decision["selected_activity_id"]:
        event.selected_activity_id = int(decision["selected_activity_id"])
    db.commit()

    return {
        "eventId": str(event.id),
        "eventNumber": event.event_number,
        "topCandidate": decision.get("top_candidate"),
        "candidateMatches": candidates,
        "decision": decision["decision"],
        "mappingConfidence": decision["mapping_confidence"],
    }


def compute_pair_score(
    db: Session, event_dict: Dict[str, Any], activity_id: int
) -> Dict[str, Any]:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")

    query_text = f"{event_dict.get('activity', '')} {event_dict.get('location', '')}"
    ev_embedding = embed_text(query_text)
    candidate_score = score_activity_candidate(event_dict, activity, event_embedding=ev_embedding)
    return candidate_score


def select_candidate_for_event(
    db: Session, event_id: int, activity_id: int, actor: str = "Planner"
) -> Dict[str, Any]:
    event = db.query(ExecutionEvent).filter(ExecutionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Execution event {event_id} not found")

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")

    prev_selected = event.selected_activity_id
    event.selected_activity_id = activity.id

    # Compute updated score
    ev_dict = {
        "activity": event.activity_description,
        "location": event.location,
        "date": event.date,
        "status": event.status,
        "raw_input": event.raw_input,
    }
    score_res = score_activity_candidate(ev_dict, activity)
    event.matching_confidence = score_res["overallConfidence"]

    # Record match decision
    match_rec = MatchDecision(
        event_id=event.id,
        selected_activity_id=activity.id,
        candidates=event.candidate_matches or [score_res],
        mapping_confidence=score_res["overallConfidence"],
        decision="selected_by_planner" if actor != "System" else "auto_selected",
        rationale=score_res["rationale"],
    )
    db.add(match_rec)

    # Record audit log
    db.add(AuditRecord(
        entity_type="ExecutionEvent",
        entity_id=event.event_number,
        actor_id=actor,
        actor_name=actor,
        actor_role="Planner Selection",
        action="MATCH_ACTIVITY_SELECTED",
        before_state={"selectedActivityId": prev_selected},
        after_state={"selectedActivityId": activity.id, "wbsCode": activity.activity_id, "confidence": score_res["overallConfidence"]},
        rationale=f"Selected candidate {activity.activity_id}: {activity.name}",
    ))

    db.commit()
    db.refresh(event)

    return {
        "success": True,
        "eventId": str(event.id),
        "selectedActivityId": str(activity.id),
        "wbsCode": activity.activity_id,
        "activityName": activity.name,
        "confidence": score_res["overallConfidence"],
        "scoreBreakdown": score_res["scoreBreakdown"],
        "rationale": score_res["rationale"],
    }
