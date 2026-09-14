"""
NEXUS - Deterministic Event Validator (Pipeline Step 5 / Validation Gate)
Deterministic software enforces schema integrity, valid ranges, and business logic sanity.
An AI model NEVER has unrestricted authority to modify authoritative project state.
"""

from typing import Dict, Any, Tuple, List
from datetime import date as date_type

REQUIRED_FIELDS = ["activity"]
VALID_STATUSES = {"started", "in_progress", "completed", "interrupted", "resumed", "halted", "not_started"}

def validate_event_dict(data: Dict[str, Any]) -> Tuple[bool, List[str], List[str], str]:
    """
    Validates an extracted event dictionary.
    Returns: (is_valid, errors, warnings, action)
    action: 'save' | 'queue_for_review' | 'reject'
    """
    errors: List[str] = []
    warnings: List[str] = []

    # 1. Required Field Check
    activity_val = data.get("activity") or data.get("activity_description")
    if not activity_val or not str(activity_val).strip():
        errors.append("Missing required field 'activity': An execution event must identify the work or task.")

    # 2. Progress percentage range check
    progress = data.get("progress")
    if progress is not None:
        try:
            p_val = float(progress)
            if not (0.0 <= p_val <= 100.0):
                errors.append(f"Progress percentage out of bounds (0-100%): {p_val}%")
        except (ValueError, TypeError):
            errors.append(f"Progress value must be numeric, got: {progress!r}")

    # 3. Quantity check
    quantity = data.get("quantity")
    if quantity is not None:
        try:
            q_val = float(quantity)
            if q_val < 0:
                errors.append(f"Installed quantity cannot be negative: {q_val}")
        except (ValueError, TypeError):
            errors.append(f"Quantity value must be numeric, got: {quantity!r}")

    # 4. Date validation
    date_val = data.get("date")
    if date_val:
        try:
            date_type.fromisoformat(str(date_val))
        except ValueError:
            warnings.append(f"Date '{date_val}' is not valid ISO YYYY-MM-DD format.")

    # 5. Status validation
    status = data.get("status")
    if status:
        st_clean = str(status).lower().strip().replace(" ", "_")
        if st_clean not in VALID_STATUSES:
            warnings.append(f"Status '{status}' not in controlled vocabulary: {sorted(VALID_STATUSES)}")

    # 6. Sanity & Business Logic Checks
    # a) Status=completed but progress < 100%
    if status == "completed" and progress is not None:
        if float(progress) < 100.0:
            warnings.append(f"Sanity Discrepancy: Event status is 'completed' but progress is only {progress}%.")

    # b) Blocker reported with completed status
    blocker = data.get("blocker")
    if blocker and status == "completed":
        warnings.append("Sanity Discrepancy: Blocker is reported on a 'completed' status event.")

    # c) Time sanity check
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    if start_time and end_time:
        try:
            if start_time > end_time:
                warnings.append(f"Time sequence discrepancy: start_time ({start_time}) is after end_time ({end_time}).")
        except Exception:
            pass

    # Determine Action Gate
    if errors:
        is_valid = False
        action = "reject"
    elif warnings:
        is_valid = True
        action = "queue_for_review"
    else:
        is_valid = True
        action = "save"

    return is_valid, errors, warnings, action
