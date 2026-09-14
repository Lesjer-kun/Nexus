"""
NEXUS - Test Suite for Module 3 (AI Extraction & NLP Pipeline)
Tests Extraction, Normalization, and Deterministic Validation Gate.
"""

from app.nlp.extractor import extract_activity_from_text
from app.nlp.normalizer import normalize_event_fields, parse_quantity, normalize_time, normalize_term
from app.nlp.validator import validate_event_dict

def test_extraction_pipe_spool():
    text = "Line 24 pipe spool erection completed around 3 PM today."
    event = extract_activity_from_text(text)

    assert event.activity is not None
    assert "pipe" in event.activity.lower() or "spool" in event.activity.lower()
    assert event.status == "completed"
    assert event.end_time == "15:00"
    assert event.quantity == 12.0
    assert event.unit == "spools"


def test_extraction_concrete_pour_with_blocker():
    text = "Concrete pouring for Block C started at 10. We stopped at 1 because the batching plant failed and we will resume tomorrow."
    event = extract_activity_from_text(text)

    assert event.activity is not None
    assert "concrete" in event.activity.lower()
    assert event.status == "interrupted"
    assert event.blocker is not None
    assert "batching plant" in event.blocker.lower()
    assert event.start_time == "10:00"
    assert event.end_time == "13:00"
    assert event.expected_resumption is not None


def test_normalization_terms_and_units():
    # Terminology
    norm_term = normalize_term("pipe fitting")
    assert norm_term == "Pipe Spool Erection & Flange Bolting"

    # Units
    val, unit = parse_quantity("26 cum")
    assert val == 26.0
    assert unit == "m³"

    val2, unit2 = parse_quantity("12 spools")
    assert val2 == 12.0
    assert unit2 == "spools"

    # Time
    assert normalize_time("3 PM") == "15:00"
    assert normalize_time("10:30 am") == "10:30"
    assert normalize_time("13:00") == "13:00"


def test_validation_gate_rules():
    # 1. Valid event
    valid_data = {
        "activity": "Pipe Spool Erection & Flange Bolting",
        "location": "Line 24",
        "progress": 100.0,
        "status": "completed",
        "quantity": 12.0,
        "date": "2026-09-14",
    }
    is_valid, errors, warnings, action = validate_event_dict(valid_data)
    assert is_valid is True
    assert len(errors) == 0
    assert action == "save"

    # 2. Missing required activity -> Reject
    missing_act = {"location": "Line 24", "progress": 50.0}
    is_valid, errors, warnings, action = validate_event_dict(missing_act)
    assert is_valid is False
    assert any("Missing required field 'activity'" in e for e in errors)
    assert action == "reject"

    # 3. Progress percentage > 100 -> Reject
    out_of_bounds = {"activity": "Concrete Pouring", "progress": 140.0}
    is_valid, errors, warnings, action = validate_event_dict(out_of_bounds)
    assert is_valid is False
    assert any("bounds" in e for e in errors)

    # 4. Status completed but progress 50% -> Queue for review
    mismatch = {
        "activity": "Compressor Foundation Concrete Pouring",
        "status": "completed",
        "progress": 50.0,
    }
    is_valid, errors, warnings, action = validate_event_dict(mismatch)
    assert is_valid is True
    assert len(warnings) > 0
    assert action == "queue_for_review"
