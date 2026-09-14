"""
NEXUS - Module 1: Project & Schedule Baseline Service Router
Endpoints:
  GET /api/projects (and /project)
  GET /api/projects/{id}
  GET /api/projects/{id}/activities (and /activities)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import Project, Activity
from app.utils.serializers import serialize_project, serialize_activity

router = APIRouter(tags=["Module 1: Project & Schedule Baseline Service"])

@router.get("/projects")
@router.get("/project")
def get_project_summary(
    project_id: int = Query(1),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    activities = db.query(Activity).filter(Activity.project_id == project_id).all()
    return serialize_project(project, activities)


@router.get("/projects/{id}")
def get_project_by_id(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {id} not found")

    activities = db.query(Activity).filter(Activity.project_id == id).all()
    return serialize_project(project, activities)


@router.get("/activities")
@router.get("/projects/{id}/activities")
def get_activities(
    id: Optional[int] = None,
    project_id: int = Query(1),
    discipline: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    target_project_id = id or project_id
    query = db.query(Activity).filter(Activity.project_id == target_project_id)

    if discipline and discipline.upper() != "ALL":
        query = query.filter(Activity.discipline == discipline)

    activities = query.all()
    return [serialize_activity(a) for a in activities]
