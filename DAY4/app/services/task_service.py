import io
import csv
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, case
from fastapi import HTTPException, status
from app.models import Task, Project
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.services.activity_service import log_activity


def sanitize_csv_cell(value: Optional[str]) -> str:
    """Mitigate CSV formula injection by quoting or prefixing sensitive start characters."""
    if not value:
        return ""
    str_val = str(value)
    if str_val.startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{str_val}"
    return str_val


def to_task_response(task: Task) -> TaskResponse:
    """Transform SQLAlchemy Task model to TaskResponse schema."""
    today = date.today()
    is_overdue = bool(task.due_date and task.due_date < today and task.status != "done")
    return TaskResponse(
        id=task.id,
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        label=task.label,
        position=task.position,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        project_name=task.project.name if task.project else None,
        project_color=task.project.color if task.project else None,
        is_overdue=is_overdue,
    )


def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Get raw Task model by ID."""
    return db.query(Task).filter(Task.id == task_id).first()


def get_tasks(
    db: Session,
    project_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    due_filter: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "position",
    limit: Optional[int] = None,
    offset: int = 0,
) -> List[TaskResponse]:
    """Retrieve filtered, searched, and sorted tasks."""
    query = db.query(Task).join(Project, Task.project_id == Project.id)

    if project_id:
        query = query.filter(Task.project_id == project_id)

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority:
        query = query.filter(Task.priority == priority)

    today = date.today()
    if due_filter == "today":
        query = query.filter(Task.due_date == today)
    elif due_filter == "upcoming":
        query = query.filter(Task.due_date > today)
    elif due_filter == "overdue":
        query = query.filter(Task.due_date < today, Task.status != "done")
    elif due_filter == "completed":
        query = query.filter(Task.status == "done")
    elif due_filter == "unscheduled":
        query = query.filter(Task.due_date.is_(None))

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Task.title.ilike(search_pattern))
            | (Task.description.ilike(search_pattern))
            | (Task.label.ilike(search_pattern))
        )

    # Sorting
    if sort_by == "due_date":
        query = query.order_by(asc(Task.due_date).nullslast(), asc(Task.id))
    elif sort_by == "priority":
        priority_order = case(
            (Task.priority == "urgent", 1),
            (Task.priority == "high", 2),
            (Task.priority == "medium", 3),
            (Task.priority == "low", 4),
            else_=5,
        )
        query = query.order_by(priority_order, asc(Task.due_date).nullslast())
    elif sort_by == "created":
        query = query.order_by(desc(Task.created_at))
    else:  # position
        query = query.order_by(asc(Task.position), asc(Task.id))

    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)

    tasks = query.all()
    return [to_task_response(t) for t in tasks]


def create_task(db: Session, task_in: TaskCreate) -> TaskResponse:
    """Create a new task under a valid project and log activity."""
    project = db.query(Project).filter(Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {task_in.project_id} not found",
        )

    # Determine position if not explicitly supplied
    position = task_in.position
    if position is None or position == 0:
        max_pos = (
            db.query(Task.position)
            .filter(Task.project_id == task_in.project_id, Task.status == task_in.status)
            .order_by(desc(Task.position))
            .first()
        )
        position = (max_pos[0] + 1) if max_pos else 0

    completed_at = datetime.now(timezone.utc) if task_in.status == "done" else None

    task = Task(
        project_id=task_in.project_id,
        title=task_in.title.strip(),
        description=task_in.description.strip() if task_in.description else None,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        label=task_in.label.strip() if task_in.label else None,
        position=position,
        completed_at=completed_at,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_activity(
        db=db,
        event_type="task_created",
        entity_type="task",
        entity_id=task.id,
        project_id=task.project_id,
        description=f"Created task '{task.title}' in '{project.name}'",
    )

    return to_task_response(task)


def update_task(db: Session, task: Task, task_in: TaskUpdate) -> TaskResponse:
    """Update task fields, validate relationships, and log activity."""
    update_data = task_in.model_dump(exclude_unset=True)

    if "project_id" in update_data and update_data["project_id"] != task.project_id:
        new_project = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not new_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target project {update_data['project_id']} not found",
            )

    old_status = task.status
    old_priority = task.priority

    for field, value in update_data.items():
        if field == "title" and value is not None:
            setattr(task, field, value.strip())
        elif field == "description" and value is not None:
            setattr(task, field, value.strip() if value else None)
        elif field == "label" and value is not None:
            setattr(task, field, value.strip() if value else None)
        else:
            setattr(task, field, value)

    # Handle completion timestamp
    if "status" in update_data:
        if update_data["status"] == "done" and old_status != "done":
            task.completed_at = datetime.now(timezone.utc)
        elif update_data["status"] != "done":
            task.completed_at = None

    db.commit()
    db.refresh(task)

    # Log appropriate events
    if "status" in update_data and update_data["status"] != old_status:
        if update_data["status"] == "done":
            log_activity(
                db=db,
                event_type="task_completed",
                entity_type="task",
                entity_id=task.id,
                project_id=task.project_id,
                description=f"Completed task '{task.title}'",
            )
        else:
            log_activity(
                db=db,
                event_type="task_status_changed",
                entity_type="task",
                entity_id=task.id,
                project_id=task.project_id,
                description=f"Moved task '{task.title}' to {task.status.replace('_', ' ').title()}",
            )
    elif "priority" in update_data and update_data["priority"] != old_priority:
        log_activity(
            db=db,
            event_type="task_priority_changed",
            entity_type="task",
            entity_id=task.id,
            project_id=task.project_id,
            description=f"Changed priority of '{task.title}' to {task.priority.upper()}",
        )
    else:
        log_activity(
            db=db,
            event_type="task_updated",
            entity_type="task",
            entity_id=task.id,
            project_id=task.project_id,
            description=f"Updated details for task '{task.title}'",
        )

    return to_task_response(task)


def update_task_status(
    db: Session, task: Task, new_status: str, position: Optional[int] = None
) -> TaskResponse:
    """Specifically update status & position for Kanban moves."""
    old_status = task.status
    task.status = new_status
    if position is not None:
        task.position = position

    if new_status == "done" and old_status != "done":
        task.completed_at = datetime.now(timezone.utc)
    elif new_status != "done":
        task.completed_at = None

    db.commit()
    db.refresh(task)

    event_type = "task_completed" if new_status == "done" else "task_status_changed"
    desc = (
        f"Completed task '{task.title}'"
        if new_status == "done"
        else f"Moved task '{task.title}' to {new_status.replace('_', ' ').title()}"
    )

    log_activity(
        db=db,
        event_type=event_type,
        entity_type="task",
        entity_id=task.id,
        project_id=task.project_id,
        description=desc,
    )

    return to_task_response(task)


def update_task_priority(db: Session, task: Task, new_priority: str) -> TaskResponse:
    """Specifically update priority of a task."""
    task.priority = new_priority
    db.commit()
    db.refresh(task)

    log_activity(
        db=db,
        event_type="task_priority_changed",
        entity_type="task",
        entity_id=task.id,
        project_id=task.project_id,
        description=f"Changed priority of '{task.title}' to {new_priority.upper()}",
    )

    return to_task_response(task)


def delete_task(db: Session, task: Task) -> dict:
    """Delete a task and record activity."""
    task_id = task.id
    task_title = task.title
    project_id = task.project_id

    log_activity(
        db=db,
        event_type="task_deleted",
        entity_type="task",
        entity_id=task_id,
        project_id=project_id,
        description=f"Deleted task '{task_title}'",
    )

    db.delete(task)
    db.commit()

    return {"message": f"Task '{task_title}' deleted successfully", "id": task_id}


def export_tasks_csv(db: Session, project_id: Optional[int] = None) -> str:
    """Generate RFC 4180 CSV export of tasks with security sanitization."""
    tasks = get_tasks(db=db, project_id=project_id, sort_by="due_date")

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header
    writer.writerow([
        "Task ID",
        "Project",
        "Title",
        "Description",
        "Status",
        "Priority",
        "Due Date",
        "Label",
        "Created At",
        "Completed At",
    ])

    for t in tasks:
        writer.writerow([
            t.id,
            sanitize_csv_cell(t.project_name),
            sanitize_csv_cell(t.title),
            sanitize_csv_cell(t.description),
            t.status,
            t.priority,
            t.due_date.isoformat() if t.due_date else "",
            sanitize_csv_cell(t.label),
            t.created_at.strftime("%Y-%m-%d %H:%M"),
            t.completed_at.strftime("%Y-%m-%d %H:%M") if t.completed_at else "",
        ])

    return output.getvalue()
