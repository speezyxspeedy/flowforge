from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import Activity, Project
from app.schemas import ActivityResponse


def log_activity(
    db: Session,
    event_type: str,
    entity_type: str,
    description: str,
    entity_id: Optional[int] = None,
    project_id: Optional[int] = None,
) -> Activity:
    """Create and persist an activity log entry."""
    activity = Activity(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        project_id=project_id,
        description=description,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def get_activities(
    db: Session,
    limit: int = 50,
    offset: int = 0,
    project_id: Optional[int] = None,
    event_type: Optional[str] = None,
) -> List[ActivityResponse]:
    """Retrieve chronological activity logs with optional filtering."""
    query = db.query(Activity).join(Project, Activity.project_id == Project.id, isouter=True)

    if project_id:
        query = query.filter(Activity.project_id == project_id)
    if event_type:
        query = query.filter(Activity.event_type == event_type)

    activities = (
        query.order_by(desc(Activity.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for act in activities:
        results.append(
            ActivityResponse(
                id=act.id,
                event_type=act.event_type,
                entity_type=act.entity_type,
                entity_id=act.entity_id,
                project_id=act.project_id,
                description=act.description,
                created_at=act.created_at,
                project_name=act.project.name if act.project else None,
            )
        )
    return results
