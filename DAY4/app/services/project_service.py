from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.models import Project, Task
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, TaskCounts
from app.services.activity_service import log_activity


def calculate_project_metrics(project: Project) -> tuple[TaskCounts, float]:
    """Calculate task counts and completion rate for a project."""
    today = date.today()
    total = len(project.tasks)
    todo = sum(1 for t in project.tasks if t.status == "todo")
    in_progress = sum(1 for t in project.tasks if t.status == "in_progress")
    done = sum(1 for t in project.tasks if t.status == "done")
    overdue = sum(1 for t in project.tasks if t.due_date and t.due_date < today and t.status != "done")

    counts = TaskCounts(
        total=total,
        todo=todo,
        in_progress=in_progress,
        done=done,
        overdue=overdue,
    )
    completion_rate = round((done / total * 100), 1) if total > 0 else 0.0
    return counts, completion_rate


def to_project_response(project: Project) -> ProjectResponse:
    """Transform SQLAlchemy Project model to ProjectResponse schema."""
    counts, completion_rate = calculate_project_metrics(project)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        color=project.color,
        status=project.status,
        start_date=project.start_date,
        due_date=project.due_date,
        created_at=project.created_at,
        updated_at=project.updated_at,
        task_counts=counts,
        completion_rate=completion_rate,
    )


def get_projects(
    db: Session,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "recent",
) -> List[ProjectResponse]:
    """Retrieve filtered and sorted projects."""
    query = db.query(Project)

    if status:
        query = query.filter(Project.status == status)
    else:
        # By default exclude archived unless requested
        query = query.filter(Project.status != "archived")

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Project.name.ilike(search_pattern)) | (Project.description.ilike(search_pattern))
        )

    if sort_by == "name":
        query = query.order_by(asc(Project.name))
    elif sort_by == "due_date":
        query = query.order_by(asc(Project.due_date).nullslast())
    else:  # recent
        query = query.order_by(desc(Project.updated_at))

    projects = query.all()
    return [to_project_response(p) for p in projects]


def get_project_by_id(db: Session, project_id: int) -> Optional[Project]:
    """Get raw project model by ID."""
    return db.query(Project).filter(Project.id == project_id).first()


def get_project_response(db: Session, project_id: int) -> Optional[ProjectResponse]:
    """Get project response schema by ID."""
    project = get_project_by_id(db, project_id)
    if not project:
        return None
    return to_project_response(project)


def create_project(db: Session, project_in: ProjectCreate) -> ProjectResponse:
    """Create a new project and log activity."""
    project = Project(
        name=project_in.name.strip(),
        description=project_in.description.strip() if project_in.description else None,
        color=project_in.color or "#7257E8",
        status=project_in.status or "active",
        start_date=project_in.start_date,
        due_date=project_in.due_date,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_activity(
        db=db,
        event_type="project_created",
        entity_type="project",
        entity_id=project.id,
        project_id=project.id,
        description=f"Created project '{project.name}'",
    )

    return to_project_response(project)


def update_project(
    db: Session, project: Project, project_in: ProjectUpdate
) -> ProjectResponse:
    """Update project details and log activity."""
    update_data = project_in.model_dump(exclude_unset=True)
    old_status = project.status

    for field, value in update_data.items():
        if field == "name" and value is not None:
            setattr(project, field, value.strip())
        elif field == "description" and value is not None:
            setattr(project, field, value.strip() if value else None)
        else:
            setattr(project, field, value)

    db.commit()
    db.refresh(project)

    event_type = "project_updated"
    desc = f"Updated project '{project.name}'"
    if "status" in update_data and update_data["status"] != old_status:
        if update_data["status"] == "archived":
            event_type = "project_archived"
            desc = f"Archived project '{project.name}'"
        elif update_data["status"] == "completed":
            desc = f"Completed project '{project.name}'"

    log_activity(
        db=db,
        event_type=event_type,
        entity_type="project",
        entity_id=project.id,
        project_id=project.id,
        description=desc,
    )

    return to_project_response(project)


def delete_project(db: Session, project: Project) -> dict:
    """Delete a project and all associated tasks, logging the event."""
    project_id = project.id
    project_name = project.name
    task_count = len(project.tasks)

    # Log activity before deletion without binding to project_id foreign key
    log_activity(
        db=db,
        event_type="project_deleted",
        entity_type="project",
        entity_id=project_id,
        project_id=None,
        description=f"Deleted project '{project_name}' and {task_count} associated task(s)",
    )

    db.delete(project)
    db.commit()

    return {"message": f"Project '{project_name}' successfully deleted", "id": project_id}
