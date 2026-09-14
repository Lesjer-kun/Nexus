"""
NEXUS - Test Suite for Module 4 (Semantic Schedule Matching Service)
Tests multi-signal hybrid matching, score breakdown, and governance decision thresholds.
"""

from database.db import SessionLocal, init_db
from database.seed_data import seed_database
from matching.activity_matching import (
    find_top_candidates,
    score_activity_candidate,
    evaluate_governance_decision,
)
from database.models import Activity

def test_matching_pipe_spool(db_session):
    event_data = {
        "activity": "Pipe spool erection & flange bolting",
        "location": "Line 24 / Block B",
        "status": "completed",
        "notes": "Line 24 pipe spool erection completed around 3 PM today.",
    }

    candidates = find_top_candidates(db_session, project_id=1, event_data=event_data, top_k=3)
    assert len(candidates) > 0

    top = candidates[0]
    assert top["wbsCode"] == "L6-PIP-001"
    assert top["discipline"] == "Piping"
    assert top["overallConfidence"] >= 0.85
    assert "semantic" in top["scoreBreakdown"]
    assert "location" in top["scoreBreakdown"]
    assert "discipline" in top["scoreBreakdown"]


def test_matching_concrete_pour(db_session):
    event_data = {
        "activity": "Compressor foundation concrete pouring",
        "location": "Block C Compressor Base",
        "status": "interrupted",
        "notes": "Concrete pouring stopped at Block C due to batching plant trip.",
    }

    candidates = find_top_candidates(db_session, project_id=1, event_data=event_data, top_k=3)
    assert len(candidates) > 0

    top = candidates[0]
    assert top["wbsCode"] == "L6-CIV-002"
    assert top["discipline"] == "Civil"
    assert top["overallConfidence"] >= 0.85


def test_matching_pump_alignment(db_session):
    event_data = {
        "activity": "Crude booster pump dial alignment",
        "location": "Booster Pump Station 2 Skid",
        "status": "completed",
        "notes": "Pump P-14 booster alignment completed.",
    }

    candidates = find_top_candidates(db_session, project_id=1, event_data=event_data, top_k=3)
    assert len(candidates) > 0

    top = candidates[0]
    assert top["wbsCode"] == "L6-MEC-003"
    assert top["discipline"] == "Mechanical / Rotating"
    assert top["overallConfidence"] >= 0.85


def test_governance_threshold_policy():
    high_conf_candidate = [{"overallConfidence": 0.95, "activityId": "1"}]
    gov_high = evaluate_governance_decision(high_conf_candidate)
    assert gov_high["decision"] == "auto_applied"

    med_conf_candidate = [{"overallConfidence": 0.72, "activityId": "2"}]
    gov_med = evaluate_governance_decision(med_conf_candidate)
    assert gov_med["decision"] == "queued_for_review"

    low_conf_candidate = [{"overallConfidence": 0.45, "activityId": "3"}]
    gov_low = evaluate_governance_decision(low_conf_candidate)
    assert gov_low["decision"] == "no_update_requested_clarification"
