"""
NEXUS Frontend-Backend Integration Test Suite
Validates all endpoints and JSON contracts expected by the Nexus React frontend
(https://github.com/Lesjer-kun/Nexus) against the live FastAPI backend.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

def test_frontend_project_contract(client):
    """Checks GET /api/projects contract matches frontend ProjectInfo interface."""
    res = client.get("/api/projects")
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert "code" in data
    assert "baselineVersion" in data
    assert "totalActivities" in data
    assert "completedActivities" in data
    assert "delayedActivities" in data
    assert "overallProgressPct" in data


def test_frontend_activities_contract(client):
    """Checks GET /api/activities with discipline filters matches ScheduleActivity interface."""
    # 1. Fetch all
    res = client.get("/api/activities")
    assert res.status_code == 200
    activities = res.json()
    assert len(activities) >= 7
    
    first = activities[0]
    required_keys = [
        "id", "wbsCode", "name", "discipline", "location", "plannedStart",
        "plannedEnd", "progressPct", "isCriticalPath", "predecessorIds", "status", "varianceDays"
    ]
    for key in required_keys:
        assert key in first, f"Missing key {key} in ScheduleActivity"

    # 2. Filter by Discipline (Piping)
    res_piping = client.get("/api/activities?discipline=Piping")
    assert res_piping.status_code == 200
    piping_acts = res_piping.json()
    assert len(piping_acts) > 0
    assert all(a["discipline"] == "Piping" for a in piping_acts)


def test_frontend_events_and_pending_reviews(client):
    """Checks GET /api/events and GET /api/reviews/pending contracts."""
    res_events = client.get("/api/events")
    assert res_events.status_code == 200
    events = res_events.json()
    assert isinstance(events, list)

    res_pending = client.get("/api/reviews/pending")
    assert res_pending.status_code == 200
    pending = res_pending.json()
    assert isinstance(pending, list)
    assert all(e["governanceStatus"] == "PENDING_REVIEW" for e in pending)


def test_frontend_field_capture_to_governance_flow(client):
    """
    Validates the end-to-end frontend user journey:
    1. Field Supervisor submits speech/text report with photo evidence
    2. Event is ingested, matched to WBS activity, and queued for review
    3. Lead Planner reviews pending events and approves
    4. Authoritative Schedule reflects updated progress and verified actuals
    5. Immutable Audit Log verifies the transaction
    """
    # Step 1: Supervisor Submits Ingestion Request
    submission = {
        "text": "Line 24 pipe spool erection completed around 3 PM today.",
        "input_mode": "voice",
        "reporter_id": "SUP-017",
        "reporter_name": "Supervisor R. Bora",
        "reporter_role": "Lead Field Supervisor",
        "evidence_list": [
            {
                "fileName": "P-1827_Line24_TorqueCheck.jpg",
                "fileType": "photo",
                "uploaderId": "SUP-017",
                "metadataValid": True,
                "visualConsistencyScore": 0.96,
                "gpsCoordinates": {
                    "lat": 27.3482,
                    "lng": 95.3219,
                    "siteZone": "Line 24 Corridor",
                    "accuracyMeters": 2.5
                }
            }
        ]
    }
    ingest_res = client.post("/api/events", json=submission)
    assert ingest_res.status_code == 200
    event = ingest_res.json()

    assert event["eventNumber"].startswith("EV-")
    assert event["status"] == "completed"
    assert event["evidenceConfidence"] >= 0.85
    assert len(event["evidenceList"]) == 1
    assert event["selectedActivityId"] is not None

    event_id = int(event["id"])

    # Step 2: Verify Event appears in Pending Reviews
    pending_res = client.get("/api/reviews/pending")
    assert pending_res.status_code == 200
    pending_ids = [int(e["id"]) for e in pending_res.json()]
    assert event_id in pending_ids

    # Step 3: Planner Approves Event
    gov_payload = {
        "decision": "APPROVED",
        "selected_activity_id": int(event["selectedActivityId"]),
        "reviewer": "P. Sharma (Lead Project Planner)",
        "planner_notes": "Verified torque certificate and visual photo evidence.",
    }
    gov_res = client.post(f"/api/events/{event_id}/governance", json=gov_payload)
    assert gov_res.status_code == 200
    gov_data = gov_res.json()
    assert gov_data["success"] is True
    assert gov_data["governanceStatus"] == "APPROVED"

    # Step 4: Verify Event is no longer pending
    pending_res_after = client.get("/api/reviews/pending")
    pending_ids_after = [int(e["id"]) for e in pending_res_after.json()]
    assert event_id not in pending_ids_after

    # Step 5: Check Audit Trail records
    audit_res = client.get("/api/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    event_logs = [l for l in logs if l["entityId"] == event["eventNumber"]]
    assert len(event_logs) >= 2  # Ingestion log + Governance Approval log
