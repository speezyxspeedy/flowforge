from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# Project Schemas
# ==========================================

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Project title")
    description: Optional[str] = Field(None, description="Detailed project description")
    color: str = Field("#7257E8", pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", description="Hex color code")
    status: str = Field("active", pattern="^(active|paused|completed|archived)$", description="Project status")
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    status: Optional[str] = Field(None, pattern="^(active|paused|completed|archived)$")
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskCounts(BaseModel):
    total: int = 0
    todo: int = 0
    in_progress: int = 0
    done: int = 0
    overdue: int = 0


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    task_counts: TaskCounts = Field(default_factory=TaskCounts)
    completion_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Task Schemas
# ==========================================

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=250, description="Task title")
    description: Optional[str] = Field(None, description="Task details and notes")
    status: str = Field("todo", pattern="^(todo|in_progress|done)$")
    priority: str = Field("medium", pattern="^(low|medium|high|urgent)$")
    due_date: Optional[date] = None
    label: Optional[str] = Field(None, max_length=100)
    project_id: int
    position: Optional[int] = 0


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=250)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    due_date: Optional[date] = None
    label: Optional[str] = Field(None, max_length=100)
    project_id: Optional[int] = None
    position: Optional[int] = None


class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(todo|in_progress|done)$")
    position: Optional[int] = None


class TaskPriorityUpdate(BaseModel):
    priority: str = Field(..., pattern="^(low|medium|high|urgent)$")


class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[date] = None
    label: Optional[str] = None
    position: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    project_name: Optional[str] = None
    project_color: Optional[str] = None
    is_overdue: bool = False

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Activity Schemas
# ==========================================

class ActivityResponse(BaseModel):
    id: int
    event_type: str
    entity_type: str
    entity_id: Optional[int] = None
    project_id: Optional[int] = None
    description: str
    created_at: datetime
    project_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Overview & Analytics Schemas
# ==========================================

class OverviewStats(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    total_tasks: int
    in_progress_tasks: int
    done_tasks: int
    todo_tasks: int
    overdue_tasks: int
    due_soon_tasks: int
    overall_completion_rate: float
    projects_in_progress: List[ProjectResponse]
    tasks_due_soon: List[TaskResponse]
    recently_updated_tasks: List[TaskResponse]
    recent_activities: List[ActivityResponse]


class AnalyticsData(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    overdue_tasks: int
    completion_rate: float
    by_priority: dict
    by_status: dict
    by_project: List[dict]
