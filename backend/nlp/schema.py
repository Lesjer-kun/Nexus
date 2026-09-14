"""
NEXUS - Constrained Extraction Schema & Pydantic Contracts
Strict schema design: explicitly null for unknown values to prevent LLM hallucinations.
Fully matches frontend types/nexus.ts.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import date as date_type

class ExtractedActivity(BaseModel):
    """
    Extracted fields from unstructured text/voice input.
    Rule: Missing values MUST be None/null, never guessed or fabricated.
    """
    activity: Optional[str] = Field(default=None, description="The specific infrastructure task or work being performed")
    location: Optional[str] = Field(default=None, description="Site location, block, line, or chainage reference")
    date: Optional[str] = Field(default=None, description="ISO format date YYYY-MM-DD")
    status: Optional[str] = Field(default=None, description="Status: started, in_progress, completed, interrupted, resumed")
    event_type: Optional[str] = Field(default="in_progress", description="Event category: started, in_progress, completed, interrupted, resumed")
    progress: Optional[float] = Field(default=None, ge=0, le=100, description="Percentage of completion, 0 to 100")
    quantity: Optional[float] = Field(default=None, description="Installed or inspected numeric quantity")
    unit: Optional[str] = Field(default=None, description="Unit of measurement, e.g., spools, m³, shaft, joints")
    quantity_raw: Optional[str] = Field(default=None, description="Original raw quantity text, e.g., '12 spools'")
    blocker: Optional[str] = Field(default=None, description="Cause of stoppage, delay, or hindrance if present")
    expected_resumption: Optional[str] = Field(default=None, description="Projected date/time when work will resume")
    start_time: Optional[str] = Field(default=None, description="Start time in 24hr format HH:MM")
    end_time: Optional[str] = Field(default=None, description="End or interruption time in 24hr format HH:MM")
    evidence_reference: Optional[str] = Field(default=None, description="Referenced photo, test log, or document name")
    notes: Optional[str] = Field(default=None, description="Additional context or supervisor commentary")
    confidence: Optional[float] = Field(default=0.85, ge=0.0, le=1.0, description="Extraction certainty score")

    @field_validator("status", "event_type")
    @classmethod
    def normalize_status_val(cls, v):
        if not v:
            return v
        v_clean = v.strip().lower().replace(" ", "_")
        allowed = {"started", "in_progress", "completed", "interrupted", "resumed", "halted", "delayed"}
        if v_clean in allowed:
            return v_clean
        # Map common terms
        mapping = {
            "start": "started",
            "done": "completed",
            "finish": "completed",
            "finished": "completed",
            "stop": "interrupted",
            "stopped": "interrupted",
            "halt": "interrupted",
            "halted": "interrupted",
            "resume": "resumed",
            "progress_update": "in_progress",
        }
        return mapping.get(v_clean, v_clean)

    @field_validator("date")
    @classmethod
    def validate_iso_date(cls, v):
        if not v:
            return v
        try:
            date_type.fromisoformat(v)
        except ValueError:
            pass  # Let normalizer/validator process or flag it
        return v


class StructuredExecutionEvent(ExtractedActivity):
    """Event enriched with provenance and uploader attribution."""
    source_filename: Optional[str] = Field(default=None)
    reporter_id: Optional[str] = Field(default="SUP-017")
    reporter_name: Optional[str] = Field(default="Field Supervisor")
    reporter_role: Optional[str] = Field(default="Lead Field Supervisor")
    input_mode: str = Field(default="text")  # voice | text | document
    raw_input: Optional[str] = Field(default="")


class ExtractionRequest(BaseModel):
    text: str = Field(..., description="Unstructured natural language report from supervisor")
    input_mode: str = Field(default="text", description="voice, text, or document")
    source_filename: Optional[str] = Field(default="")
    project_id: int = Field(default=1)
    reporter_id: str = Field(default="SUP-017")
    reporter_name: Optional[str] = Field(default="Supervisor R. Bora")
    reporter_role: Optional[str] = Field(default="Lead Field Supervisor")
    audio_duration_seconds: Optional[float] = None
    evidence_list: List[Dict[str, Any]] = Field(default_factory=list)


class NormalizationRequest(BaseModel):
    event_data: Dict[str, Any]


class NormalizationResponse(BaseModel):
    normalized_data: Dict[str, Any]
    changes_made: List[str]


class ValidationRequest(BaseModel):
    event_data: Dict[str, Any]


class ValidationResponse(BaseModel):
    is_valid: bool
    action: str  # save | queue_for_review | reject
    reason: Optional[str] = None
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    sanitized_event: Dict[str, Any]
