"""
NEXUS - Module 8: Audit Trail & Immutable Ledger Router
Endpoints:
  GET /api/audit-logs (and /audit-logs)
  GET /api/audit-logs/{id}
  GET /api/audit-logs/event/{eventId}
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.db import get_db
from database.models import AuditRecord
from utils.serializers import serialize_audit

router = APIRouter(tags=["Module 8: Audit Trail & Immutable Ledger"])

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(200, le=1000),
    entity_type: str = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(AuditRecord)
    if entity_type:
        query = query.filter(AuditRecord.entity_type == entity_type)

    records = query.order_by(desc(AuditRecord.timestamp)).limit(limit).all()
    return [serialize_audit(r) for r in records]


@router.get("/audit-logs/event/{eventId}")
def get_audit_records_for_event(eventId: str, db: Session = Depends(get_db)):
    records = (
        db.query(AuditRecord)
        .filter(AuditRecord.entity_type == "ExecutionEvent")
        .filter(AuditRecord.entity_id == eventId)
        .order_by(desc(AuditRecord.timestamp))
        .all()
    )
    return [serialize_audit(r) for r in records]


@router.get("/audit-logs/{id}")
def get_audit_record(id: int, db: Session = Depends(get_db)):
    record = db.query(AuditRecord).filter(AuditRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Audit record not found")
    return serialize_audit(record)
