from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Project, Task
from app.schemas import OverviewStats, AnalyticsData
from app.services import project_service, task_service, activity_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=OverviewStats)
def get_overview(db: Session = Depends(get_db)):
    """Calculate overview productivity statistics and recent items."""
    today = date.today()
    in_7_days = today + timedelta(days=7)

    # Projects
    all_projects = db.query(Project).all()
    non_archived_projects = [p for p in all_projects if p.status != "archived"]
    total_projects = len(non_archived_projects)
    active_projects = sum(1 for p in non_archived_projects if p.status == "active")
    completed_projects = sum(1 for p in non_archived_projects if p.status == "completed")

    # Tasks
    all_tasks = db.query(Task).all()
    total_tasks = len(all_tasks)
    in_progress_tasks = sum(1 for t in all_tasks if t.status == "in_progress")
    done_tasks = sum(1 for t in all_tasks if t.status == "done")
    todo_tasks = sum(1 for t in all_tasks if t.status == "todo")
    overdue_tasks = sum(1 for t in all_tasks if t.due_date and t.due_date < today and t.status != "done")
    due_soon_tasks = sum(
        1 for t in all_tasks if t.due_date and today <= t.due_date <= in_7_days and t.status != "done"
    )

    overall_completion_rate = (
        round((done_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0
    )

    # Projects in progress (active projects with calculated metrics)
    active_project_models = [p for p in non_archived_projects if p.status == "active"][:6]
    projects_in_progress = [project_service.to_project_response(p) for p in active_project_models]

    # Tasks due soon (due between today and +7 days or overdue, sorted by due_date)
    due_soon_models = (
        db.query(Task)
        .filter(Task.status != "done", Task.due_date.isnot(None), Task.due_date <= in_7_days)
        .order_by(Task.due_date.asc())
        .limit(6)
        .all()
    )
    tasks_due_soon = [task_service.to_task_response(t) for t in due_soon_models]

    # Recently updated tasks
    recent_task_models = (
        db.query(Task).order_by(desc(Task.updated_at)).limit(6).all()
    )
    recently_updated_tasks = [task_service.to_task_response(t) for t in recent_task_models]

    # Recent activities
    recent_activities = activity_service.get_activities(db=db, limit=8)

    return OverviewStats(
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        total_tasks=total_tasks,
        in_progress_tasks=in_progress_tasks,
        done_tasks=done_tasks,
        todo_tasks=todo_tasks,
        overdue_tasks=overdue_tasks,
        due_soon_tasks=due_soon_tasks,
        overall_completion_rate=overall_completion_rate,
        projects_in_progress=projects_in_progress,
        tasks_due_soon=tasks_due_soon,
        recently_updated_tasks=recently_updated_tasks,
        recent_activities=recent_activities,
    )


@router.get("/analytics", response_model=AnalyticsData)
def get_analytics(db: Session = Depends(get_db)):
    """Provide structured analytics data for visualizations."""
    today = date.today()
    all_tasks = db.query(Task).all()
    total_tasks = len(all_tasks)
    completed_tasks = sum(1 for t in all_tasks if t.status == "done")
    in_progress_tasks = sum(1 for t in all_tasks if t.status == "in_progress")
    todo_tasks = sum(1 for t in all_tasks if t.status == "todo")
    overdue_tasks = sum(1 for t in all_tasks if t.due_date and t.due_date < today and t.status != "done")

    completion_rate = (
        round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0
    )

    by_priority = {
        "urgent": sum(1 for t in all_tasks if t.priority == "urgent"),
        "high": sum(1 for t in all_tasks if t.priority == "high"),
        "medium": sum(1 for t in all_tasks if t.priority == "medium"),
        "low": sum(1 for t in all_tasks if t.priority == "low"),
    }

    by_status = {
        "todo": todo_tasks,
        "in_progress": in_progress_tasks,
        "done": completed_tasks,
    }

    projects = db.query(Project).filter(Project.status != "archived").all()
    by_project = []
    for p in projects:
        p_total = len(p.tasks)
        p_done = sum(1 for t in p.tasks if t.status == "done")
        p_rate = round((p_done / p_total * 100), 1) if p_total > 0 else 0.0
        by_project.append({
            "id": p.id,
            "name": p.name,
            "color": p.color,
            "total": p_total,
            "done": p_done,
            "rate": p_rate,
        })

    return AnalyticsData(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        todo_tasks=todo_tasks,
        overdue_tasks=overdue_tasks,
        completion_rate=completion_rate,
        by_priority=by_priority,
        by_status=by_status,
        by_project=by_project,
    )


@router.post("/seed-demo")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seed sample workspace with curated demo projects and tasks."""
    today = date.today()

    # Create 3 demo projects
    p1 = Project(
        name="[Demo] Brand Identity & Design System",
        description="Craft an editorial brand voice, refined typography system, and accessible design tokens.",
        color="#7257E8",
        status="active",
        start_date=today - timedelta(days=10),
        due_date=today + timedelta(days=15),
    )
    p2 = Project(
        name="[Demo] Mobile App v2.0 Architecture",
        description="Re-architect cross-platform offline sync engine and responsive drag-and-drop navigation.",
        color="#4E79A7",
        status="active",
        start_date=today - timedelta(days=5),
        due_date=today + timedelta(days=22),
    )
    p3 = Project(
        name="[Demo] Q4 Product Launch & Marketing",
        description="Coordinate press release kit, high-converting interactive landing pages, and launch metrics.",
        color="#E56A54",
        status="active",
        start_date=today - timedelta(days=3),
        due_date=today + timedelta(days=30),
    )
    db.add_all([p1, p2, p3])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)
    db.refresh(p3)

    # Activity for projects
    activity_service.log_activity(
        db, "project_created", "project", f"Created sample project '{p1.name}'", p1.id, p1.id
    )
    activity_service.log_activity(
        db, "project_created", "project", f"Created sample project '{p2.name}'", p2.id, p2.id
    )
    activity_service.log_activity(
        db, "project_created", "project", f"Created sample project '{p3.name}'", p3.id, p3.id
    )

    # Demo tasks for p1
    demo_tasks = [
        Task(
            project_id=p1.id,
            title="Design warm editorial color palette and accessibility contrast matrix",
            description="Establish primary ivory background, rich violet accents, and AA-grade text ratios.",
            status="done",
            priority="high",
            due_date=today - timedelta(days=2),
            label="Design",
            position=0,
            completed_at=today - timedelta(days=1),
        ),
        Task(
            project_id=p1.id,
            title="Refine typography scale and select display headline pairing",
            description="Pair Plus Jakarta Sans with Fraunces for distinctive editorial hierarchy.",
            status="done",
            priority="medium",
            due_date=today - timedelta(days=1),
            label="Typography",
            position=1,
            completed_at=today - timedelta(days=1),
        ),
        Task(
            project_id=p1.id,
            title="Build interactive Kanban board with HTML5 native drag-and-drop",
            description="Support fluid column transfers, visual drop feedback, and instant state rollback.",
            status="in_progress",
            priority="urgent",
            due_date=today,
            label="Frontend",
            position=0,
        ),
        Task(
            project_id=p1.id,
            title="Implement responsive mobile navigation drawer and swipeable columns",
            description="Ensure flawless viewport fitting on narrow devices without horizontal spill.",
            status="todo",
            priority="high",
            due_date=today + timedelta(days=3),
            label="Mobile",
            position=0,
        ),
        # Demo tasks for p2
        Task(
            project_id=p2.id,
            title="Evaluate SQLite WAL journaling mode performance under concurrent queries",
            description="Run benchmark tests on Windows 11 with connection pool pragma optimizations.",
            status="done",
            priority="medium",
            due_date=today - timedelta(days=4),
            label="Backend",
            position=0,
            completed_at=today - timedelta(days=3),
        ),
        Task(
            project_id=p2.id,
            title="Design secure CSV export with formula injection mitigations",
            description="Sanitize cells starting with =, +, -, @ before writing spreadsheet rows.",
            status="in_progress",
            priority="high",
            due_date=today + timedelta(days=1),
            label="Security",
            position=0,
        ),
        Task(
            project_id=p2.id,
            title="Implement global Ctrl+K search dialog with keyboard navigation",
            description="Allow instant jumping across all active projects and assigned tasks.",
            status="todo",
            priority="urgent",
            due_date=today + timedelta(days=5),
            label="UX",
            position=0,
        ),
        # Demo tasks for p3
        Task(
            project_id=p3.id,
            title="Draft product announcement blog post and press release",
            description="Highlight editorial productivity philosophy and contrast with generic dashboards.",
            status="todo",
            priority="medium",
            due_date=today + timedelta(days=8),
            label="Content",
            position=0,
        ),
        Task(
            project_id=p3.id,
            title="Prepare high-res showcase media assets and screen captures",
            description="Capture authentic workflow clips demonstrating Kanban drag-and-drop and calendar views.",
            status="todo",
            priority="low",
            due_date=today + timedelta(days=12),
            label="Assets",
            position=1,
        ),
    ]
    db.add_all(demo_tasks)
    db.commit()

    # Log task activities
    for t in demo_tasks:
        db.refresh(t)
        activity_service.log_activity(
            db,
            "task_created",
            "task",
            f"Created demo task '{t.title}'",
            t.id,
            t.project_id,
        )

    return {"message": "Demo workspace successfully seeded with 3 projects and 9 tasks."}
