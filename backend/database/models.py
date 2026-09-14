"""
NEXUS - Authoritative Relational & Vector Data Models
Core schema representing Projects, L5/L6 Schedule Activities, Execution Events,
Evidence, Match Decisions, Validations, Audit Logs, and Institutional Memory.
"""

import json
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, JSON, TypeDecorator
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from app.config import settings

Base = declarative_base()

class EmbeddingType(TypeDecorator):
    """
    Polymorphic embedding type:
    Uses native pgvector Vector if postgres is used,
    otherwise serializes as JSON list of floats for SQLite compatibility.
    """
    impl = Text
    cache_ok = True

    def __init__(self, dim=1024, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(self.dim))
            except ImportError:
                return dialect.type_descriptor(Text())
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == 'postgresql':
            return value
        if isinstance(value, list):
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return None
        return value


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., OIL-DNPL-01
    name = Column(String(255), nullable=False)
    client = Column(String(255), default="Oil India Limited")
    location = Column(String(255), nullable=False)
    baseline_version = Column(String(50), default="Rev-C (Authoritative)")
    owner = Column(String(100), default="Project Management Office")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan")
    events = relationship("ExecutionEvent", back_populates="project", cascade="all, delete-orphan")
    memory_records = relationship("MemoryRecord", back_populates="project", cascade="all, delete-orphan")


class Activity(Base):
    """
    L5/L6 planned schedule activity (from Primavera P6 / MS Project / Excel import).
    Authoritative schedule state mutated only by verified governance actions.
    """
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    activity_id = Column(String(50), index=True, nullable=False)  # WBS code e.g. "L6-PIP-001" or "A-124"
    name = Column(String(255), nullable=False)                    # e.g. "Line 24 Pipe Spool Erection"
    discipline = Column(String(50), nullable=False)               # Piping, Civil, Mechanical / Rotating, Electrical, Instrumentation, HSE
    location = Column(String(255), nullable=False)                # Line 24 / Block B
    equipment_tag = Column(String(100), nullable=True)            # P-14, C-01, TK-101
    planned_start = Column(DateTime, nullable=False)
    planned_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    baseline_duration_days = Column(Integer, default=1)
    actual_duration_days = Column(Integer, nullable=True)
    progress_pct = Column(Float, default=0.0)
    is_critical_path = Column(Boolean, default=False)
    dependencies = Column(JSON, default=list)                     # list of predecessor activity WBS/IDs
    status = Column(String(50), default="NOT_STARTED")            # NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, HALTED
    variance_days = Column(Integer, default=0)                    # Positive = delayed, negative = ahead
    unit_of_measure = Column(String(50), nullable=True)           # spools, m3, joints, meters
    planned_quantity = Column(Float, nullable=True)
    installed_quantity = Column(Float, default=0.0)
    embedding = Column(EmbeddingType(dim=settings.EMBEDDING_DIM), nullable=True)

    project = relationship("Project", back_populates="activities")
    events = relationship("ExecutionEvent", back_populates="selected_activity")


class ExecutionEvent(Base):
    """
    Structured Execution Event created from unstructured supervisor text/voice reports.
    Follows constrained schema with anti-hallucination guarantees.
    """
    __tablename__ = "execution_events"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    event_number = Column(String(50), unique=True, index=True, nullable=False)  # EV-10492
    reporter = Column(String(100), nullable=False)                               # SUP-017
    reporter_name = Column(String(150), default="Field Supervisor")
    reporter_role = Column(String(100), default="Lead Field Supervisor")
    raw_input = Column(Text, nullable=False)
    input_mode = Column(String(20), default="text")                              # voice | text | document
    audio_duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Constrained Schema Fields (explicit null when absent)
    event_type = Column(String(50), nullable=True)                               # started, in_progress, completed, interrupted, resumed
    activity_description = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    date = Column(String(50), nullable=True)                                     # ISO YYYY-MM-DD
    start_time = Column(String(20), nullable=True)                               # HH:MM
    end_time = Column(String(20), nullable=True)                                 # HH:MM
    status = Column(String(50), nullable=True)                                   # started, in_progress, completed, interrupted, resumed
    quantity = Column(Float, nullable=True)
    quantity_unit = Column(String(50), nullable=True)
    quantity_raw = Column(String(100), nullable=True)
    blocker = Column(Text, nullable=True)
    expected_resumption = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    source = Column(String(255), nullable=True)

    # Schedule Linking & Confidence Scores
    matching_confidence = Column(Float, default=0.0)
    evidence_confidence = Column(Float, default=0.0)
    candidate_matches = Column(JSON, default=list)                               # list of CandidateMatch dicts
    selected_activity_id = Column(Integer, ForeignKey("activities.id"), nullable=True)
    governance_status = Column(String(50), default="PENDING_REVIEW")             # PENDING_REVIEW, APPROVED, CORRECTED, REJECTED, NEEDS_CLARIFICATION
    planner_review_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    embedding = Column(EmbeddingType(dim=settings.EMBEDDING_DIM), nullable=True)

    project = relationship("Project", back_populates="events")
    selected_activity = relationship("Activity", back_populates="events")
    evidence_items = relationship("Evidence", back_populates="event", cascade="all, delete-orphan")
    match_decision = relationship("MatchDecision", back_populates="event", uselist=False, cascade="all, delete-orphan")


class Evidence(Base):
    """
    Evidence & Provenance records attached to Execution Events.
    Preserves audit trail, EXIF timestamps, GPS coordinates, and visual consistency scores.
    """
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("execution_events.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), default="photo")                              # photo | report_pdf | timesheet
    file_url = Column(String(500), nullable=True)
    uploader_id = Column(String(100), nullable=False)
    uploader_name = Column(String(150), default="Supervisor")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    site_zone = Column(String(150), nullable=True)
    accuracy_meters = Column(Float, default=3.0)
    metadata_valid = Column(Boolean, default=True)
    visual_consistency_score = Column(Float, default=0.90)                       # 0.0 - 1.0
    evidence_hash = Column(String(128), nullable=True)                           # sha256 hash
    notes = Column(Text, nullable=True)

    event = relationship("ExecutionEvent", back_populates="evidence_items")


class MatchDecision(Base):
    """
    Records the hybrid matching results and governance decisions.
    """
    __tablename__ = "match_decisions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("execution_events.id"), nullable=False, index=True)
    selected_activity_id = Column(Integer, ForeignKey("activities.id"), nullable=True)
    candidates = Column(JSON, default=list)                                      # Candidate list with score breakdown
    mapping_confidence = Column(Float, default=0.0)
    decision = Column(String(50), default="queued_for_review")                  # auto_applied | queued_for_review | no_update_requested_clarification
    rationale = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("ExecutionEvent", back_populates="match_decision")


class Validation(Base):
    """
    Planner review and governance actions on execution events.
    """
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("execution_events.id"), nullable=False, index=True)
    reviewer = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)                                  # APPROVED | CORRECTED | REJECTED | NEEDS_CLARIFICATION
    corrected_activity_id = Column(Integer, nullable=True)
    corrected_fields = Column(JSON, nullable=True)
    comment = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditRecord(Base):
    """
    Immutable ledger: Every material action, calculation, state transition,
    or governance decision is recorded with actor, before/after diffs, and hash.
    """
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)                 # ExecutionEvent, Activity, MatchDecision, etc.
    entity_id = Column(String(50), nullable=False, index=True)
    actor_id = Column(String(100), nullable=False)
    actor_name = Column(String(150), default="System")
    actor_role = Column(String(100), default="Automated Service")
    action = Column(String(100), nullable=False)                                 # INGEST_FIELD_EVENT, GOVERNANCE_APPROVED, etc.
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    rationale = Column(Text, nullable=True)
    evidence_hash = Column(String(128), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class MemoryRecord(Base):
    """
    Institutional Memory: Validated execution events and lessons learned,
    indexed with embeddings for RAG retrieval.
    """
    __tablename__ = "memory_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    discipline = Column(String(50), nullable=False)
    project_code = Column(String(50), default="OIL-DNPL-01")
    date = Column(String(50), nullable=False)
    summary = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    source_event_ref = Column(String(50), nullable=False)
    matched_keywords = Column(JSON, default=list)
    relevance_score = Column(Float, default=1.0)
    embedding = Column(EmbeddingType(dim=settings.EMBEDDING_DIM), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="memory_records")
