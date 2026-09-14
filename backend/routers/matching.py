"""
NEXUS - Module 4: Semantic Schedule Matching Service Router
Endpoints:
  POST /api/match/candidates (and /match/candidates)
  POST /api/match/score (and /match/score)
  POST /api/match/select (and /match/select)
  POST /api/match/{event_id} (and /match/{event_id})
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import ExecutionEvent
from app.matching.activity_matching import (
    find_top_candidates,
    evaluate_governance_decision,
)
from app.matching.matcher_service import (
    get_candidates_for_event,
    compute_pair_score,
    select_candidate_for_event,
)

router = APIRouter(tags=["Module 4: Semantic Schedule Matching Service"])

class MatchCandidatesRequest(BaseModel):
    event_id: Optional[int] = Field(default=None, description="ID of existing event in DB")
    project_id: int = Field(default=1)
    event_data: Optional[Dict[str, Any]] = Field(default=None, description="Ad-hoc extracted event dictionary")
    top_k: int = Field(default=3, description="Number of candidates to return")


class MatchScoreRequest(BaseModel):
    event_data: Dict[str, Any]
    activity_id: int


class MatchSelectRequest(BaseModel):
    event_id: int
    activity_id: int
    actor: str = "Planner"


@router.post("/match/candidates")
def match_candidates(req: MatchCandidatesRequest, db: Session = Depends(get_db)):
    """
    Step 5-6: Semantic vector retrieval + structured multi-signal ranking.
    Retrieves ranked candidate L5/L6 activities for an execution event.
    """
    if req.event_id:
        return get_candidates_for_event(db, req.event_id, top_k=req.top_k)

    if not req.event_data:
        raise HTTPException(status_code=400, detail="Must provide either event_id or event_data")

    candidates = find_top_candidates(db, req.project_id, req.event_data, top_k=req.top_k)
    decision = evaluate_governance_decision(candidates)

    return {
        "candidateMatches": candidates,
        "topCandidate": decision.get("top_candidate"),
        "decision": decision["decision"],
        "governanceStatus": decision["governance_status"],
        "mappingConfidence": decision["mapping_confidence"],
    }


@router.post("/match/score")
def score_pair(req: MatchScoreRequest, db: Session = Depends(get_db)):
    """
    Scores a specific (event, activity) pair with explainable multi-signal breakdown:
    Semantic similarity, location match, discipline match, schedule window, equipment tag.
    """
    result = compute_pair_score(db, req.event_data, req.activity_id)
    return result


@router.post("/match/select")
def select_candidate(req: MatchSelectRequest, db: Session = Depends(get_db)):
    """
    Attaches a selected candidate activity to an execution event and records audit trail.
    """
    return select_candidate_for_event(db, req.event_id, req.activity_id, req.actor)


@router.post("/match/{event_id}")
def match_event_by_id(event_id: int, db: Session = Depends(get_db)):
    """
    Convenience endpoint matching an execution event by ID.
    """
    return get_candidates_for_event(db, event_id)
