from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskPriorityUpdate,
    TaskResponse,
)
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status: todo, in_progress, done"),
    priority: Optional[str] = Query(None, description="Filter by priority: low, medium, high, urgent"),
    due_filter: Optional[str] = Query(
        None, description="Filter by due state: today, upcoming, overdue, completed, unscheduled"
    ),
    search: Optional[str] = Query(None, description="Search in task title, description, or label"),
    sort_by: str = Query("position", description="Sort by: position, due_date, priority, created"),
    limit: Optional[int] = Query(None, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve filtered, searched, and sorted tasks."""
    return task_service.get_tasks(
        db=db,
        project_id=project_id,
        status_filter=status,
        priority=priority,
        due_filter=due_filter,
        search=search,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )


@router.get("/export/csv")
def export_csv(
    project_id: Optional[int] = Query(None, description="Optional project ID to export only its tasks"),
    db: Session = Depends(get_db),
):
    """Export tasks as an RFC-compliant CSV with formula injection sanitization."""
    csv_content = task_service.export_tasks_csv(db=db, project_id=project_id)
    filename = f"flowforge_tasks_export.csv" if not project_id else f"flowforge_project_{project_id}_tasks.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    return task_service.create_task(db=db, task_in=task_in)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Retrieve a single task by its ID."""
    task = task_service.get_task_by_id(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task_service.to_task_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    """Update task details."""
    task = task_service.get_task_by_id(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task_service.update_task(db=db, task=task, task_in=task_in)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int, status_update: TaskStatusUpdate, db: Session = Depends(get_db)
):
    """Quickly update task status (used by Drag & Drop Kanban board)."""
    task = task_service.get_task_by_id(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task_service.update_task_status(
        db=db, task=task, new_status=status_update.status, position=status_update.position
    )


@router.patch("/{task_id}/priority", response_model=TaskResponse)
def update_task_priority(
    task_id: int, priority_update: TaskPriorityUpdate, db: Session = Depends(get_db)
):
    """Update task priority."""
    task = task_service.get_task_by_id(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task_service.update_task_priority(
        db=db, task=task, new_priority=priority_update.priority
    )


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    task = task_service.get_task_by_id(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task_service.delete_task(db=db, task=task)
