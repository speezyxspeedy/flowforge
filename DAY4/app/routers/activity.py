from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ActivityResponse
from app.services import activity_service

router = APIRouter(prefix="/api/activity", tags=["Activity"])


@router.get("", response_model=List[ActivityResponse])
def get_activity_timeline(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve chronological activity events."""
    return activity_service.get_activities(
        db=db,
        limit=limit,
        offset=offset,
        project_id=project_id,
        event_type=event_type,
    )
