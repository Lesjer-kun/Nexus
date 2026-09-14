"""
NEXUS - Terminology & Value Normalizer (Pipeline Step 4)
Converts colloquial field jargon, informal units, time expressions, and synonym terms
into standardized controlled domain entities.
"""

import re
from datetime import datetime, date as date_type
from typing import Optional, Tuple, Dict, Any, List
from difflib import SequenceMatcher

# Unit standardization mapping
UNIT_NORMALIZATION = {
    "cum": "m³",
    "cu.m": "m³",
    "cu m": "m³",
    "m3": "m³",
    "cubic meter": "m³",
    "cubic meters": "m³",
    "spool": "spools",
    "spools": "spools",
    "nos": "units",
    "no": "units",
    "numbers": "units",
    "mtr": "meters",
    "mtrs": "meters",
    "m": "meters",
    "meter": "meters",
    "meters": "meters",
    "joint": "joints",
    "joints": "joints",
    "shaft": "shaft",
    "loop": "loops",
    "loops": "loops",
    "zone": "zone",
}

# Construction domain synonym mapping to canonical activities
SYNONYM_MAP = {
    # Piping
    "pipe fitting": "Pipe Spool Erection & Flange Bolting",
    "piping erection": "Pipe Spool Erection & Flange Bolting",
    "pipe installation": "Pipe Spool Erection & Flange Bolting",
    "pipe spool erection": "Pipe Spool Erection & Flange Bolting",
    "flange bolting": "Pipe Spool Erection & Flange Bolting",
    "spool fixing": "Pipe Spool Erection & Flange Bolting",
    "tie-in welding": "Line 24 Tie-in Radiographic Testing (NDT)",
    "radiography": "Line 24 Tie-in Radiographic Testing (NDT)",
    "radiographic testing": "Line 24 Tie-in Radiographic Testing (NDT)",
    "gamma rt": "Line 24 Tie-in Radiographic Testing (NDT)",
    "ndt test": "Line 24 Tie-in Radiographic Testing (NDT)",

    # Civil
    "foundation work": "Compressor Foundation Concrete Pouring",
    "concrete pouring": "Compressor Foundation Concrete Pouring",
    "concreting": "Compressor Foundation Concrete Pouring",
    "foundation concrete": "Compressor Foundation Concrete Pouring",
    "compressor foundation": "Compressor Foundation Concrete Pouring",
    "raft casting": "Compressor Foundation Concrete Pouring",

    # Mechanical / Rotating
    "pump alignment": "Crude Booster Pump P-14 Dial Alignment",
    "pump alignment check": "Crude Booster Pump P-14 Dial Alignment",
    "dial alignment": "Crude Booster Pump P-14 Dial Alignment",
    "dial gauge check": "Crude Booster Pump P-14 Dial Alignment",
    "booster pump alignment": "Crude Booster Pump P-14 Dial Alignment",
    "p-14 alignment": "Crude Booster Pump P-14 Dial Alignment",

    # Electrical
    "cable trenching": "415V Switchgear Cable Trenching & Tray Installation",
    "tray installation": "415V Switchgear Cable Trenching & Tray Installation",
    "cabling": "415V Switchgear Cable Trenching & Tray Installation",
    "switchgear cabling": "415V Switchgear Cable Trenching & Tray Installation",

    # Instrumentation
    "loop calibration": "SCADA RTU Signal Loop Calibration & Termination",
    "rtu termination": "SCADA RTU Signal Loop Calibration & Termination",
    "signal calibration": "SCADA RTU Signal Loop Calibration & Termination",

    # HSE
    "hydrotest clearance": "Hydrotest Safety Clearance & Exclusion Zone Setup",
    "exclusion zone setup": "Hydrotest Safety Clearance & Exclusion Zone Setup",
    "safety barrier": "Hydrotest Safety Clearance & Exclusion Zone Setup",
}

CONTROLLED_TERMS = sorted(set(SYNONYM_MAP.values()))

QUANTITY_REGEX = re.compile(r"([-+]?\d*\.?\d+)\s*([a-zA-Z³\./]+)?")
TIME_REGEX_12H = re.compile(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", re.IGNORECASE)
TIME_REGEX_24H = re.compile(r"(\b[0-2]?\d):([0-5]\d)\b")

def parse_quantity(raw_str: Optional[str]) -> Tuple[Optional[float], Optional[str]]:
    """
    Parses '12 spools' -> (12.0, 'spools'), '26 cum' -> (26.0, 'm³').
    """
    if not raw_str or not str(raw_str).strip():
        return None, None

    s = str(raw_str).strip()
    match = QUANTITY_REGEX.search(s)
    if not match:
        return None, None

    num_str, unit_str = match.groups()
    try:
        val = float(num_str)
    except ValueError:
        return None, None

    canonical_unit = None
    if unit_str:
        cleaned_unit = unit_str.strip().lower().rstrip(".")
        canonical_unit = UNIT_NORMALIZATION.get(cleaned_unit, cleaned_unit)

    return val, canonical_unit


def normalize_time(raw_time: Optional[str]) -> Optional[str]:
    """
    Normalizes '3 PM' -> '15:00', '10:30 am' -> '10:30', '15:00' -> '15:00'.
    """
    if not raw_time or not str(raw_time).strip():
        return None

    s = str(raw_time).strip()

    # Match 12h format
    m12 = TIME_REGEX_12H.search(s)
    if m12:
        hour = int(m12.group(1))
        minute = int(m12.group(2)) if m12.group(2) else 0
        ampm = m12.group(3).lower()
        if ampm == "pm" and hour < 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}"

    # Match 24h format
    m24 = TIME_REGEX_24H.search(s)
    if m24:
        hour = int(m24.group(1))
        minute = int(m24.group(2))
        return f"{hour:02d}:{minute:02d}"

    return s


def normalize_term(raw_term: Optional[str], threshold: float = 0.70) -> Optional[str]:
    """
    Fuzzy and exact normalization of construction activity terminology.
    """
    if not raw_term or not str(raw_term).strip():
        return raw_term

    term_clean = str(raw_term).strip().lower()

    # Exact dictionary lookup
    if term_clean in SYNONYM_MAP:
        return SYNONYM_MAP[term_clean]

    # Partial substring search in synonym map
    for k, v in SYNONYM_MAP.items():
        if k in term_clean or term_clean in k:
            return v

    # Fuzzy match with controlled vocabulary
    best_match = None
    best_score = 0.0
    for canonical in CONTROLLED_TERMS:
        score = SequenceMatcher(None, term_clean, canonical.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = canonical

    if best_score >= threshold and best_match:
        return best_match

    # Keep original cleaned text if no confident synonym
    return raw_term.strip().title()


def normalize_date(raw_date: Optional[str]) -> Optional[str]:
    """
    Normalizes 'today', '14 September 2026', '2026-09-14' to 'YYYY-MM-DD'.
    """
    if not raw_date or not str(raw_date).strip():
        return None

    s = str(raw_date).strip()
    if s.lower() in ("today", "current", "now"):
        return datetime.now().date().isoformat()

    # Try ISO first
    try:
        return date_type.fromisoformat(s).isoformat()
    except Exception:
        pass

    # Try common formats
    for fmt in ("%d %B %Y", "%d %b %Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass

    return s


def normalize_event_fields(event_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    """
    Comprehensive normalization applied to all fields of an extracted event.
    Returns normalized dictionary and list of changes made.
    """
    normalized = dict(event_dict)
    changes: List[str] = []

    # 1. Activity Description
    if normalized.get("activity"):
        orig = normalized["activity"]
        normalized["activity"] = normalize_term(orig)
        if normalized["activity"] != orig:
            changes.append(f"Normalized activity: '{orig}' -> '{normalized['activity']}'")

    if normalized.get("activity_description"):
        orig = normalized["activity_description"]
        normalized["activity_description"] = normalize_term(orig)
        if normalized["activity_description"] != orig:
            changes.append(f"Normalized activity_description: '{orig}' -> '{normalized['activity_description']}'")

    # 2. Quantity and Unit
    raw_qty = normalized.get("quantity_raw") or normalized.get("quantity")
    if raw_qty is not None:
        val, unit = parse_quantity(str(raw_qty))
        if val is not None:
            normalized["quantity"] = val
            changes.append(f"Parsed numeric quantity: {val}")
        if unit is not None:
            normalized["unit"] = unit
            changes.append(f"Standardized unit: '{unit}'")

    # 3. Time normalization
    if normalized.get("start_time"):
        t_norm = normalize_time(normalized["start_time"])
        if t_norm != normalized["start_time"]:
            changes.append(f"Normalized start_time: '{normalized['start_time']}' -> '{t_norm}'")
            normalized["start_time"] = t_norm

    if normalized.get("end_time"):
        t_norm = normalize_time(normalized["end_time"])
        if t_norm != normalized["end_time"]:
            changes.append(f"Normalized end_time: '{normalized['end_time']}' -> '{t_norm}'")
            normalized["end_time"] = t_norm

    # 4. Date normalization
    if normalized.get("date"):
        d_norm = normalize_date(normalized["date"])
        if d_norm != normalized["date"]:
            changes.append(f"Normalized date: '{normalized['date']}' -> '{d_norm}'")
            normalized["date"] = d_norm

    # 5. Status normalization
    if normalized.get("status"):
        st = str(normalized["status"]).lower().strip().replace(" ", "_")
        status_map = {
            "finish": "completed",
            "finished": "completed",
            "done": "completed",
            "halt": "interrupted",
            "halted": "interrupted",
            "stop": "interrupted",
            "stopped": "interrupted",
            "breakdown": "interrupted",
            "delay": "interrupted",
            "delayed": "interrupted",
            "start": "started",
            "resumed": "resumed",
            "ongoing": "in_progress",
        }
        mapped = status_map.get(st, st)
        if mapped != normalized["status"]:
            changes.append(f"Normalized status: '{normalized['status']}' -> '{mapped}'")
            normalized["status"] = mapped
            normalized["event_type"] = mapped

    return normalized, changes
