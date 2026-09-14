"""
NEXUS - Test Suite for Endpoints & API Integration
Tests FastAPI endpoints for Field Capture, NLP Extraction, Matching, Governance, and Audit.
"""

from fastapi.testclient import TestClient
from main import app
from database.db import init_db, SessionLocal
from database.seed_data import seed_database

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_extract_endpoint(client):
    payload = {
        "text": "Line 24 pipe spool erection completed around 3 PM today.",
        "input_mode": "voice",
        "reporter_id": "SUP-017",
    }
    res = client.post("/api/extract", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "extracted" in data
    assert data["extracted"]["status"] == "completed"
    assert data["extracted"]["end_time"] == "15:00"


def test_normalize_endpoint(client):
    payload = {
        "event_data": {
            "activity": "pipe fitting",
            "quantity_raw": "26 cum",
            "end_time": "3 PM",
        }
    }
    res = client.post("/api/extract/normalize", json=payload)
    assert res.status_code == 200
    data = res.json()
    norm = data["normalized_data"]
    assert norm["activity"] == "Pipe Spool Erection & Flange Bolting"
    assert norm["unit"] == "m³"
    assert norm["quantity"] == 26.0
    assert norm["end_time"] == "15:00"


def test_validate_endpoint(client):
    # Valid
    res = client.post("/api/extract/validate", json={
        "event_data": {"activity": "Pipe Spool Erection", "progress": 80.0, "status": "in_progress"}
    })
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
    assert res.json()["action"] == "save"

    # Reject
    res_bad = client.post("/api/extract/validate", json={
        "event_data": {"progress": 150.0}
    })
    assert res_bad.status_code == 200
    assert res_bad.json()["action"] == "reject"


def test_match_candidates_endpoint(client):
    payload = {
        "project_id": 1,
        "event_data": {
            "activity": "Pipe spool erection & flange bolting",
            "location": "Line 24 / Block B",
            "status": "completed",
        },
        "top_k": 3,
    }
    res = client.post("/api/match/candidates", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["candidateMatches"]) > 0
    top = data["candidateMatches"][0]
    assert top["wbsCode"] == "L6-PIP-001"
    assert top["overallConfidence"] >= 0.85


def test_field_capture_ingest_pipeline(client):
    payload = {
        "text": "Line 24 pipe spool erection completed around 3 PM today.",
        "input_mode": "voice",
        "reporter_id": "SUP-017",
        "reporter_name": "Supervisor R. Bora",
        "evidence_list": [
            {
                "fileName": "P-1827_Line24_FlangeTorque.jpg",
                "fileType": "photo",
                "uploaderId": "SUP-017",
                "metadataValid": True,
                "visualConsistencyScore": 0.95,
            }
        ]
    }
    res = client.post("/api/events", json=payload)
    assert res.status_code == 200
    ev = res.json()
    assert ev["eventNumber"].startswith("EV-")
    assert ev["status"] == "completed"
    assert ev["selectedActivityId"] is not None
    assert len(ev["candidateMatches"]) > 0
    assert len(ev["evidenceList"]) == 1

    event_id = ev["id"]

    # Retrieve by ID
    get_res = client.get(f"/api/events/{event_id}")
    assert get_res.status_code == 200
    assert get_res.json()["eventNumber"] == ev["eventNumber"]


def test_governance_approval_updates_schedule(client):
    # Ingest event
    res = client.post("/api/events", json={
        "text": "Crude booster pump dial alignment completed.",
        "input_mode": "text",
        "reporter_id": "SUP-009",
    })
    ev = res.json()
    event_id = int(ev["id"])

    # Approve event
    approve_res = client.post(f"/api/events/{event_id}/governance", json={
        "decision": "APPROVED",
        "selected_activity_id": 3,
        "reviewer": "P. Sharma (Lead Project Planner)",
        "planner_notes": "Alignment dial verified with 0.02mm runout tolerances.",
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["governanceStatus"] == "APPROVED"

    # Verify Activity updated in schedule
    act_res = client.get("/api/activities")
    activities = act_res.json()
    act3 = next(a for a in activities if a["id"] == "3")
    assert act3["status"] == "COMPLETED"
    assert act3["progressPct"] == 100.0


def test_institutional_memory_search(client):
    res = client.post("/api/memory/search", json={
        "query": "Have we seen similar pipe spool erection delays and what were the causes?"
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["retrievedCitations"]) > 0
    assert "Fastener" in data["answer"] or "pipe" in data["answer"].lower()
