"""
NEXUS - Hybrid L5/L6 Schedule Activity Matching Service
Combines semantic vector embeddings with structured disambiguation parameters:
location, discipline, equipment tags, schedule window, and exact WBS activity IDs.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date as date_type
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import Activity, ExecutionEvent
from app.matching.embeddings import embed_text, embed_query, cosine_similarity

# Multi-Signal Weights defined in Solution Blueprint Section 6.4 / 7.1
WEIGHTS = {
    "semantic": 0.40,
    "location": 0.20,
    "discipline": 0.15,
    "schedule_window": 0.15,
    "equipment_match": 0.10,
}


def compute_location_score(event_loc: Optional[str], act_loc: Optional[str]) -> float:
    """Evaluates location consistency between field report and schedule baseline."""
    if not event_loc or not act_loc:
        return 0.5  # Neutral when unspecified

    el = event_loc.strip().lower()
    al = act_loc.strip().lower()

    if el == al:
        return 0.98
    if el in al or al in el:
        return 0.92
    # Partial token overlap
    tokens_e = set(el.replace("/", " ").replace("-", " ").split())
    tokens_a = set(al.replace("/", " ").replace("-", " ").split())
    overlap = tokens_e.intersection(tokens_a)
    if overlap:
        return 0.85
    return 0.25


def compute_discipline_score(
    activity_desc: Optional[str], notes: Optional[str], act_discipline: Optional[str]
) -> float:
    """Evaluates discipline alignment (Piping, Civil, Electrical, etc.)."""
    if not act_discipline:
        return 0.5

    combined = f"{activity_desc or ''} {notes or ''}".lower()
    disc_lower = act_discipline.lower()

    if disc_lower in combined:
        return 0.95

    # Discipline domain keywords
    discipline_keywords = {
        "piping": ["pipe", "spool", "flange", "bolting", "valve", "tie-in", "weld", "welding", "hydrotest", "ndt"],
        "civil": ["concrete", "pour", "foundation", "chute", "slump", "excavation", "rebar", "raft", "batching"],
        "mechanical / rotating": ["pump", "compressor", "shaft", "alignment", "dial", "vibration", "bearing", "motor"],
        "electrical": ["cable", "trench", "tray", "switchgear", "panel", "415v", "transformer", "wiring"],
        "instrumentation": ["scada", "rtu", "loop", "transmitter", "calibration", "signal", "sensor", "plc"],
        "hse": ["safety", "barrier", "exclusion", "clearance", "permit", "ptw", "fire", "gas"],
    }

    for key, kw_list in discipline_keywords.items():
        if key in disc_lower:
            if any(kw in combined for kw in kw_list):
                return 0.92

    return 0.40


def compute_equipment_score(
    text_context: Optional[str], equipment_tag: Optional[str]
) -> float:
    """Evaluates equipment tag presence (e.g. Pump P-14, Line 24, C-01)."""
    if not equipment_tag:
        return 0.5  # Neutral

    if not text_context:
        return 0.5

    eq_clean = equipment_tag.strip().lower()
    ctx_clean = text_context.strip().lower()

    if eq_clean in ctx_clean:
        return 0.96

    # Match tokens (e.g. "P-14" or "Line 24")
    tokens = [t for t in eq_clean.replace("-", " ").split() if len(t) > 1]
    if any(t in ctx_clean for t in tokens):
        return 0.88

    return 0.45


def compute_schedule_window_score(
    event_date: Optional[str], planned_start: Optional[datetime], planned_end: Optional[datetime]
) -> float:
    """Evaluates temporal plausibility against planned schedule dates."""
    if not event_date or not planned_start or not planned_end:
        return 0.85  # Neutral default

    try:
        if isinstance(event_date, str):
            ev_d = date_type.fromisoformat(event_date[:10])
        else:
            ev_d = event_date
        p_start = planned_start.date()
        p_end = planned_end.date()

        # Within planned window
        if p_start <= ev_d <= p_end:
            return 0.95

        # Grace window within 7 days
        diff_days = min(abs((ev_d - p_start).days), abs((ev_d - p_end).days))
        if diff_days <= 7:
            return 0.80
        return 0.45
    except Exception:
        return 0.70


def compute_activity_id_match(text_context: Optional[str], activity_wbs: str) -> float:
    """Exact Activity ID / WBS Code presence (e.g. 'A-124', 'L6-PIP-001')."""
    if not text_context or not activity_wbs:
        return 0.0

    ctx_clean = text_context.lower()
    wbs_clean = activity_wbs.lower()

    if wbs_clean in ctx_clean:
        return 1.0

    # Match number suffix e.g. "001" or "002"
    suffix = activity_wbs.split("-")[-1]
    if len(suffix) >= 3 and suffix in ctx_clean:
        return 0.85

    return 0.0


def score_activity_candidate(
    event_dict: Dict[str, Any],
    activity: Activity,
    event_embedding: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Computes multi-signal score breakdown and overall confidence for an activity candidate.
    """
    # 1. Semantic Embedding Similarity
    act_text = f"{activity.name} {activity.discipline} {activity.location} {activity.equipment_tag or ''}"
    if event_embedding is not None:
        act_embedding = activity.embedding if isinstance(activity.embedding, list) else embed_text(act_text)
        semantic_score = cosine_similarity(event_embedding, act_embedding)
    else:
        # Fallback keyword overlap
        ev_words = set(str(event_dict.get("activity") or event_dict.get("activity_description") or "").lower().split())
        act_words = set(act_text.lower().split())
        overlap = ev_words.intersection(act_words)
        semantic_score = min(0.95, 0.35 + (len(overlap) * 0.2))

    # Boost semantic score if activity title phrases appear in event
    ev_act_lower = str(event_dict.get("activity") or event_dict.get("activity_description") or "").lower()
    act_name_clean = activity.name.lower()
    if activity.equipment_tag:
        act_name_clean = act_name_clean.replace(activity.equipment_tag.lower(), "").replace("  ", " ").strip()

    if ev_act_lower and (ev_act_lower in act_text.lower() or activity.name.lower() in ev_act_lower or act_name_clean in ev_act_lower or ev_act_lower in act_name_clean):
        semantic_score = max(semantic_score, 0.95)

    # 2. Location Score
    event_loc = event_dict.get("location") or event_dict.get("candidateLocation")
    loc_score = compute_location_score(event_loc, activity.location)

    # 3. Discipline Score
    context_text = f"{event_dict.get('activity', '')} {event_dict.get('raw_input', '')} {event_dict.get('notes', '')}"
    disc_score = compute_discipline_score(
        event_dict.get("activity"), context_text, activity.discipline
    )

    # 4. Equipment Score
    eq_score = compute_equipment_score(context_text, activity.equipment_tag)

    # 5. Schedule Window Score
    win_score = compute_schedule_window_score(
        event_dict.get("date"), activity.planned_start, activity.planned_end
    )

    # Calculate weighted composite confidence
    composite = (
        semantic_score * WEIGHTS["semantic"]
        + loc_score * WEIGHTS["location"]
        + disc_score * WEIGHTS["discipline"]
        + win_score * WEIGHTS["schedule_window"]
        + eq_score * WEIGHTS["equipment_match"]
    )

    # 6. Exact Activity ID Boost
    wbs_boost = compute_activity_id_match(context_text, activity.activity_id)
    if wbs_boost > 0.8:
        composite = max(composite, 0.98)

    overall_confidence = round(min(0.99, max(0.10, composite)), 2)

    rationale = (
        f"Matched {activity.discipline} domain at {activity.location} "
        f"with {int(overall_confidence * 100)}% combined multi-signal confidence "
        f"(Semantic: {int(semantic_score * 100)}%, Location: {int(loc_score * 100)}%, "
        f"Discipline: {int(disc_score * 100)}%)."
    )

    return {
        "activityId": str(activity.id),
        "wbsCode": activity.activity_id,
        "activityName": activity.name,
        "discipline": activity.discipline,
        "location": activity.location,
        "equipmentTag": activity.equipment_tag or "",
        "overallConfidence": overall_confidence,
        "scoreBreakdown": {
            "semantic": round(semantic_score, 2),
            "location": round(loc_score, 2),
            "discipline": round(disc_score, 2),
            "scheduleWindow": round(win_score, 2),
            "equipmentMatch": round(eq_score, 2),
        },
        "rationale": rationale,
    }


def find_top_candidates(
    db: Session,
    project_id: int,
    event_data: Dict[str, Any],
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Retrieves and ranks candidate schedule activities for an extracted event.
    """
    activities = db.query(Activity).filter(Activity.project_id == project_id).all()
    if not activities:
        return []

    # Compute event query embedding
    query_text = f"{event_data.get('activity') or event_data.get('activity_description') or ''} {event_data.get('location') or ''}"
    ev_embedding = embed_query(query_text)

    scored_candidates = []
    for act in activities:
        scored = score_activity_candidate(event_data, act, event_embedding=ev_embedding)
        scored_candidates.append(scored)

    # Sort descending by overall confidence
    scored_candidates.sort(key=lambda x: x["overallConfidence"], reverse=True)
    return scored_candidates[:top_k]


def evaluate_governance_decision(candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Applies Section 6.4 governed confidence policy:
    >= 0.90 -> auto_applied / high confidence proposed
    >= 0.60 -> mandatory planner review
    < 0.60  -> clarification requested
    """
    if not candidates:
        return {
            "decision": "no_match",
            "governance_status": "NEEDS_CLARIFICATION",
            "selected_activity_id": None,
            "mapping_confidence": 0.0,
            "reason": "No plausible L5/L6 schedule activities found in project baseline.",
        }

    top = candidates[0]
    conf = top["overallConfidence"]

    if conf >= settings.AUTO_ACCEPT_THRESHOLD:
        decision = "auto_applied"
        status = "PENDING_REVIEW"  # In NEXUS, planner reviews all high-impact before committing to baseline
    elif conf >= settings.REVIEW_THRESHOLD:
        decision = "queued_for_review"
        status = "PENDING_REVIEW"
    else:
        decision = "no_update_requested_clarification"
        status = "NEEDS_CLARIFICATION"

    return {
        "decision": decision,
        "governance_status": status,
        "selected_activity_id": top["activityId"],
        "mapping_confidence": conf,
        "top_candidate": top,
        "candidates": candidates,
    }
