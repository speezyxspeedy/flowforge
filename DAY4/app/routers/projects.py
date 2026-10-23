from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services import project_service

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    status: Optional[str] = Query(None, description="Filter by status: active, paused, completed, archived"),
    search: Optional[str] = Query(None, description="Search term in project name or description"),
    sort_by: str = Query("recent", description="Sort by: recent, name, due_date"),
    db: Session = Depends(get_db),
):
    """List all projects with task counts and progress calculations."""
    return project_service.get_projects(db=db, status=status, search=search, sort_by=sort_by)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    return project_service.create_project(db=db, project_in=project_in)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Retrieve a project by its unique ID."""
    project = project_service.get_project_response(db=db, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db)
):
    """Update an existing project's metadata."""
    project = project_service.get_project_by_id(db=db, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return project_service.update_project(db=db, project=project, project_in=project_in)


@router.post("/{project_id}/archive", response_model=ProjectResponse)
def toggle_archive_project(
    project_id: int,
    archive: bool = Query(True, description="True to archive, False to restore active"),
    db: Session = Depends(get_db),
):
    """Archive or restore a project."""
    project = project_service.get_project_by_id(db=db, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    new_status = "archived" if archive else "active"
    return project_service.update_project(
        db=db, project=project, project_in=ProjectUpdate(status=new_status)
    )


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Permanently delete a project and all associated tasks."""
    project = project_service.get_project_by_id(db=db, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return project_service.delete_project(db=db, project=project)
