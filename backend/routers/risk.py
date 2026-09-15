"""
NEXUS - Module 9.5: Risk & Alert Service Router
Endpoints:
  GET /api/risk/alerts (and /risk/alerts)
  GET /api/risk/alerts/{id}
  POST /api/risk/evaluate (and /risk/evaluate)
 """

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.db import get_db
from database.models import ExecutionEvent, Activity
from utils.serializers import serialize_event, serialize_activity

router = APIRouter(tags=["Module 9.5: Risk & Alert Service"])


class RiskAlert(BaseModel):
    id: str
    eventId: str
    eventNumber: str
    type: str  # 'variance' | 'dependency' | 'blocker' | 'completion' | 'milestone'
    severity: str  # 'low' | 'medium' | 'high' | 'critical'
    title: str
    description: str
    activityId: Optional[str] = None
    activityWbsCode: Optional[str] = None
    scheduledDaysAhead: Optional[int] = None
    scheduledDaysBehind: Optional[int] = None
    relatedBlockerId: Optional[str] = None
    isResolved: bool = False
    createdAt: str
    resolvedAt: Optional[str] = None
    resolvedBy: Optional[str] = None


class EvaluateRiskRequest(BaseModel):
    eventIds: Optional[List[int]] = Field(default=None, description="Specific event IDs to evaluate; defaults to all PENDING_REVIEW")
    projectId: int = Field(default=1)


def evaluate_schedule_risks(db, event_ids=None, project_id=1):
    """
    Evaluates schedule risks based on current activities state:
    - Variance thresholds (positive variance = delayed)
    - Dependency chain failures
    - Blocker propagation
    - Completion risk assessment
    """
    alerts = []

    # If specific event IDs provided, only evaluate those
    if event_ids:
        events = (
            db.query(ExecutionEvent)
            .filter(ExecutionEvent.id.in_(event_ids))
            .filter(ExecutionEvent.project_id == project_id)
            .all()
        )
    else:
        events = (
            db.query(ExecutionEvent)
            .filter(ExecutionEvent.project_id == project_id)
            .all()
        )

    # Get all activities for the project
    activities = (
        db.query(Activity)
        .filter(Activity.project_id == project_id)
        .all()
    )
    activity_map = {str(a.id): a for a in activities}

    for event in events:
        # Evaluate all events that have been matched to activities
        if not event.selected_activity_id:
            continue

        # Evaluate variance risk
        if event.selected_activity_id and str(event.selected_activity_id) in activity_map:
            activity = activity_map[str(event.selected_activity_id)]

            if activity.variance_days > 0:
                severity = "critical" if activity.variance_days > 5 else "high" if activity.variance_days > 2 else "medium"
                alerts.append(RiskAlert(
                    id=f"risk-{event.id}-variance",
                    eventId=str(event.id),
                    eventNumber=event.event_number,
                    type="variance",
                    severity=severity,
                    title=f"Schedule variance detected: +{activity.variance_days}d",
                    description=f"Activity {activity.activity_id} ({activity.name}) is delayed by {activity.variance_days} days. "
                                f"This impacts downstream dependencies and may require replanning.",
                    activityId=str(activity.id),
                    activityWbsCode=activity.activity_id,
                    scheduledDaysBehind=activity.variance_days,
                ))

            # Evaluate completion risk for in-progress activities
            if activity.status == "IN_PROGRESS":
                if activity.progress_pct < 50 and activity.planned_start and activity.planned_end:
                    from datetime import datetime as dt
                    today = dt.now().date()
                    planned_start = activity.planned_start.date() if hasattr(activity.planned_start, 'date') else activity.planned_start
                    planned_end = activity.planned_end.date() if hasattr(activity.planned_end, 'date') else activity.planned_end

                    days_since_start = (today - planned_start).days if isinstance(planned_start, type(today)) else 0
                    days_until_end = (planned_end - today).days if isinstance(planned_end, type(today)) else 0

                    if days_since_start > 0 and days_until_end > 0 and activity.progress_pct < 30:
                        severity = "high" if days_until_end < days_since_start * 0.3 else "medium"
                        alerts.append(RiskAlert(
                            id=f"risk-{event.id}-completion",
                            eventId=str(event.id),
                            eventNumber=event.event_number,
                            type="completion",
                            severity=severity,
                            title=f"Completion risk: {activity.progress_pct}% progress",
                            description=f"Activity {activity.activity_id} is only {activity.progress_pct}% complete "
                                        f"with {days_until_end} days remaining until planned end.",
                            scheduledDaysAhead=days_until_end,
                        ))

        # Evaluate dependency risk: check if any dependent events have blockers
        # Find events that reference this event as a blocker or dependency
        dependent_events = (
            db.query(ExecutionEvent)
            .filter(ExecutionEvent.project_id == project_id)
            .filter(ExecutionEvent.blocker == event.event_number)
            .all()
        )

        for dep_event in dependent_events:
            if dep_event.selected_activity_id and str(dep_event.selected_activity_id) in activity_map:
                dep_activity = activity_map[str(dep_event.selected_activity_id)]
                if dep_activity.variance_days and dep_activity.variance_days > 0:
                    severity = "critical" if dep_activity.variance_days > 5 else "high" if dep_activity.variance_days > 2 else "medium"
                    alerts.append(RiskAlert(
                        id=f"risk-{event.id}-dep-{dep_event.id}",
                        eventId=str(event.id),
                        eventNumber=event.event_number,
                        type="dependency",
                        severity=severity,
                        title=f"Dependency chain risk: {dep_event.event_number} affected",
                        description=f"Event {dep_event.event_number} depends on {event.event_number}. "
                                    f"Downstream variance of {dep_activity.variance_days} days may propagate.",
                        activityId=str(dep_activity.id),
                        activityWbsCode=dep_activity.activity_id,
                        relatedBlockerId=event.event_number,
                    ))

    # Sort by severity order: critical > high > medium > low
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda a: severity_order.get(a.severity, 99))

    return alerts


@router.get("/alerts")
def get_risk_alerts(project_id: int = 1, db: Session = Depends(get_db)):
    """Returns all active risk alerts for a project."""
    alerts = evaluate_schedule_risks(db, project_id=project_id)
    return [alert.model_dump() for alert in alerts]


@router.get("/alerts/{alert_id}")
def get_risk_alert(alert_id: str, db: Session = Depends(get_db)):
    """Returns a specific risk alert by ID."""
    # This is a simplified lookup; in production would query DB directly
    alerts = evaluate_schedule_risks(db, project_id=1)
    for alert in alerts:
        if alert.id == alert_id:
            return alert.model_dump()
    raise HTTPException(status_code=404, detail="Risk alert not found")


@router.post("/evaluate")
def evaluate_risk(req: EvaluateRiskRequest, db: Session = Depends(get_db)):
    """Evaluates risk for specified events and returns new/updated alerts."""
    alerts = evaluate_schedule_risks(db, event_ids=req.eventIds, project_id=req.projectId)
    return {"alerts": [a.model_dump() for a in alerts], "count": len(alerts)}