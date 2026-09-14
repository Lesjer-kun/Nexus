"""
NEXUS - Baseline Seed Data
Seeds authoritative Oil India Limited project metadata, L5/L6 activities,
and historical memory records for immediate demonstration.
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.models import Project, Activity, ExecutionEvent, AuditRecord, MemoryRecord

def seed_database(db: Session):
    # Check if project already exists
    existing_project = db.query(Project).filter_by(id=1).first()
    if existing_project:
        return

    # 1. Seed Project
    project = Project(
        id=1,
        code="OIL-DNPL-01",
        name="Duliajan-Numaligarh Pipeline Expansion (DNPL) - Phase II",
        client="Oil India Limited",
        location="Upper Assam Basin (Duliajan - Numaligarh Sector)",
        baseline_version="Rev-C (Authoritative)",
        owner="Oil India Project Management Directorate",
    )
    db.add(project)
    db.flush()

    today = datetime.now().date()

    # 2. Seed L5/L6 Schedule Activities
    activities_data = [
        {
            "id": 1,
            "activity_id": "L6-PIP-001",
            "name": "Line 24 Pipe Spool Erection & Flange Bolting",
            "discipline": "Piping",
            "location": "Line 24 / Block B",
            "equipment_tag": "Line 24 Spool Rack",
            "planned_start": datetime.combine(today - timedelta(days=2), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=3), datetime.min.time()),
            "baseline_duration_days": 5,
            "progress_pct": 60.0,
            "is_critical_path": True,
            "dependencies": [],
            "status": "IN_PROGRESS",
            "variance_days": 0,
            "unit_of_measure": "spools",
            "planned_quantity": 20.0,
            "installed_quantity": 12.0,
        },
        {
            "id": 2,
            "activity_id": "L6-CIV-002",
            "name": "Compressor Foundation Concrete Pouring",
            "discipline": "Civil",
            "location": "Block C Compressor Base",
            "equipment_tag": "Batching Plant BP-02",
            "planned_start": datetime.combine(today - timedelta(days=1), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=2), datetime.min.time()),
            "baseline_duration_days": 3,
            "progress_pct": 45.0,
            "is_critical_path": True,
            "dependencies": ["L6-CIV-001"],
            "status": "HALTED",
            "variance_days": 1,
            "unit_of_measure": "m³",
            "planned_quantity": 50.0,
            "installed_quantity": 26.0,
        },
        {
            "id": 3,
            "activity_id": "L6-MEC-003",
            "name": "Crude Booster Pump P-14 Dial Alignment",
            "discipline": "Mechanical / Rotating",
            "location": "Booster Pump Station 2 Skid",
            "equipment_tag": "P-14",
            "planned_start": datetime.combine(today, datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=1), datetime.min.time()),
            "baseline_duration_days": 2,
            "progress_pct": 80.0,
            "is_critical_path": False,
            "dependencies": ["L6-PIP-001"],
            "status": "IN_PROGRESS",
            "variance_days": 0,
            "unit_of_measure": "shaft",
            "planned_quantity": 1.0,
            "installed_quantity": 0.8,
        },
        {
            "id": 4,
            "activity_id": "L6-PIP-004",
            "name": "Line 24 Tie-in Radiographic Testing (NDT)",
            "discipline": "Piping",
            "location": "Line 24",
            "equipment_tag": "Gamma RT Unit-03",
            "planned_start": datetime.combine(today + timedelta(days=3), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=6), datetime.min.time()),
            "baseline_duration_days": 3,
            "progress_pct": 0.0,
            "is_critical_path": True,
            "dependencies": ["L6-PIP-001"],
            "status": "NOT_STARTED",
            "variance_days": 0,
            "unit_of_measure": "joints",
            "planned_quantity": 8.0,
            "installed_quantity": 0.0,
        },
        {
            "id": 5,
            "activity_id": "L6-ELE-005",
            "name": "415V Switchgear Cable Trenching & Tray Installation",
            "discipline": "Electrical",
            "location": "Substation 4",
            "equipment_tag": "SWG-415-A",
            "planned_start": datetime.combine(today - timedelta(days=5), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=1), datetime.min.time()),
            "baseline_duration_days": 4,
            "actual_start": datetime.combine(today - timedelta(days=5), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=1), datetime.min.time()),
            "progress_pct": 100.0,
            "is_critical_path": False,
            "dependencies": [],
            "status": "COMPLETED",
            "variance_days": 0,
            "unit_of_measure": "meters",
            "planned_quantity": 180.0,
            "installed_quantity": 180.0,
        },
        {
            "id": 6,
            "activity_id": "L6-INS-006",
            "name": "SCADA RTU Signal Loop Calibration & Termination",
            "discipline": "Instrumentation",
            "location": "Control Room Alpha",
            "equipment_tag": "RTU-CR-01",
            "planned_start": datetime.combine(today + timedelta(days=2), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=5), datetime.min.time()),
            "baseline_duration_days": 4,
            "progress_pct": 10.0,
            "is_critical_path": False,
            "dependencies": ["L6-ELE-005"],
            "status": "IN_PROGRESS",
            "variance_days": 0,
            "unit_of_measure": "loops",
            "planned_quantity": 24.0,
            "installed_quantity": 2.0,
        },
        {
            "id": 7,
            "activity_id": "L6-HSE-007",
            "name": "Hydrotest Safety Clearance & Exclusion Zone Setup",
            "discipline": "HSE",
            "location": "Line 24 East Corridor",
            "equipment_tag": "Safety Barrier Kit-1",
            "planned_start": datetime.combine(today + timedelta(days=7), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=8), datetime.min.time()),
            "baseline_duration_days": 1,
            "progress_pct": 0.0,
            "is_critical_path": True,
            "dependencies": ["L6-PIP-004"],
            "status": "NOT_STARTED",
            "variance_days": 0,
            "unit_of_measure": "zone",
            "planned_quantity": 1.0,
            "installed_quantity": 0.0,
        },
    ]

    for item in activities_data:
        act = Activity(
            id=item["id"],
            project_id=1,
            activity_id=item["activity_id"],
            name=item["name"],
            discipline=item["discipline"],
            location=item["location"],
            equipment_tag=item.get("equipment_tag"),
            planned_start=item["planned_start"],
            planned_end=item["planned_end"],
            actual_start=item.get("actual_start"),
            actual_end=item.get("actual_end"),
            baseline_duration_days=item["baseline_duration_days"],
            progress_pct=item["progress_pct"],
            is_critical_path=item["is_critical_path"],
            dependencies=item["dependencies"],
            status=item["status"],
            variance_days=item["variance_days"],
            unit_of_measure=item["unit_of_measure"],
            planned_quantity=item["planned_quantity"],
            installed_quantity=item["installed_quantity"],
        )
        db.add(act)

    # 3. Seed Initial Execution Event
    initial_event = ExecutionEvent(
        id=1,
        project_id=1,
        event_number="EV-10492",
        reporter="SUP-017",
        reporter_name="Supervisor R. Bora",
        reporter_role="Lead Field Supervisor",
        raw_input="Line 24 pipe spool erection completed around 3 PM today.",
        input_mode="voice",
        audio_duration_seconds=14.5,
        event_type="completed",
        activity_description="Pipe spool erection & flange bolting",
        location="Line 24 / Block B",
        date=str(today),
        start_time="09:00",
        end_time="15:00",
        status="completed",
        quantity=12.0,
        quantity_unit="spools",
        quantity_raw="12 spools",
        blocker=None,
        expected_resumption=None,
        notes="Line 24 pipe spool erection completed around 3 PM today.",
        source="voice_recording_10492.wav",
        matching_confidence=0.96,
        evidence_confidence=0.95,
        selected_activity_id=1,
        governance_status="APPROVED",
        planner_review_notes="Verified against flange torque logs and photo P-1827.",
        reviewed_by="P. Sharma (Lead Project Planner)",
        reviewed_at=datetime.utcnow(),
    )
    db.add(initial_event)

    # 4. Seed Audit Records
    db.add(AuditRecord(
        entity_type="ExecutionEvent",
        entity_id="EV-10492",
        actor_id="SYS-NLP",
        actor_name="NEXUS Hybrid Matcher",
        actor_role="System Extraction",
        action="INGEST_FIELD_EVENT",
        before_state=None,
        after_state={"rawInput": "Line 24 pipe spool erection completed around 3 PM today.", "matchedActivity": "L6-PIP-001", "confidence": 0.96},
        rationale="Natural language supervisor report parsed and linked to candidate L5/L6 activities.",
        evidence_hash="sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    ))

    db.add(AuditRecord(
        entity_type="ExecutionEvent",
        entity_id="EV-10492",
        actor_id="PLN-003",
        actor_name="P. Sharma",
        actor_role="Senior Project Planner",
        action="GOVERNANCE_APPROVED",
        before_state={"governanceStatus": "PENDING_REVIEW", "selectedActivityId": 1},
        after_state={"governanceStatus": "APPROVED", "selectedActivityId": 1, "scheduleUpdated": True},
        rationale="Verified against flange torque logs and photo P-1827.",
        evidence_hash="sha256:8b47e2a9b2341d2f094ac54f0a2100874e1d9320e8b159f"
    ))

    # 5. Seed Institutional Memory Records (for RAG)
    db.add(MemoryRecord(
        id=1,
        project_id=1,
        title="Pipe Spool Erection Delayed by MTC Fastener Discrepancy",
        discipline="Piping",
        project_code="OIL-DNPL-01",
        date="2025-11-18",
        summary="Pipe spool erection at Line 24 corridor was delayed by 5 days due to ASTM A193 B7 stud bolt Mill Test Certificate discrepancies and subsequent tie-in NDT backlog.",
        root_cause="Mill Test Certificates delivered from supplier did not match batch numbers on the 1.5-inch studs. Downstream gamma RT inspections halted during daytime hours.",
        resolution="Implemented pre-quarantine verification at central warehouse spool yard. Deployed Phased Array Ultrasonic Testing (PAUT) in lieu of darkroom gamma radiography to prevent daytime exclusion halts.",
        source_event_ref="EV-09142",
        matched_keywords=["pipe", "spool", "flange", "erection", "ndt", "radiography"],
        relevance_score=0.98,
    ))

    db.add(MemoryRecord(
        id=2,
        project_id=1,
        title="Compressor Foundation Concrete Batching Plant Failure",
        discipline="Civil",
        project_code="OIL-CS-02",
        date="2026-02-10",
        summary="Compressor foundation pour halted at Block C after aggregate moisture probe drift during heavy rains resulted in out-of-spec slump at delivery chute.",
        root_cause="Heavy monsoon downpours saturated coarse aggregate bins; probe calibration drifted by 4.2%, causing batcher mix ratio rejection.",
        resolution="Applied rapid cold-joint retarder to exposed cold face. Erected temporary overhead rain shelters over aggregate bins and instituted 2-hour moisture burn-off verification cycles.",
        source_event_ref="EV-09823",
        matched_keywords=["concrete", "pour", "batching", "plant", "foundation", "block c"],
        relevance_score=0.95,
    ))

    db.commit()
