def test_empty_dashboard_calculations(client):
    res = client.get("/api/dashboard/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] == 0
    assert data["total_tasks"] == 0
    assert data["overall_completion_rate"] == 0.0
    assert data["projects_in_progress"] == []
    assert data["tasks_due_soon"] == []


def test_dashboard_with_data(client):
    p = client.post("/api/projects", json={"name": "Dashboard Sprint", "color": "#7257E8"}).json()
    pid = p["id"]

    # Add 1 done task, 1 in_progress, 1 todo
    client.post("/api/tasks", json={"title": "T1", "project_id": pid, "status": "done", "priority": "high"})
    client.post("/api/tasks", json={"title": "T2", "project_id": pid, "status": "in_progress", "priority": "medium"})
    client.post("/api/tasks", json={"title": "T3", "project_id": pid, "status": "todo", "priority": "low"})

    res = client.get("/api/dashboard/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] == 1
    assert data["total_tasks"] == 3
    assert data["done_tasks"] == 1
    assert data["in_progress_tasks"] == 1
    assert data["todo_tasks"] == 1
    # 1/3 = 33.3%
    assert round(data["overall_completion_rate"], 1) == 33.3


def test_analytics_endpoint(client):
    p = client.post("/api/projects", json={"name": "Analytics Proj", "color": "#7257E8"}).json()
    pid = p["id"]
    client.post("/api/tasks", json={"title": "T1", "project_id": pid, "status": "done", "priority": "urgent"})

    res = client.get("/api/dashboard/analytics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_tasks"] == 1
    assert data["completed_tasks"] == 1
    assert data["by_priority"]["urgent"] == 1
    assert data["by_status"]["done"] == 1
    assert len(data["by_project"]) == 1
    assert data["by_project"][0]["name"] == "Analytics Proj"


def test_seed_demo_workspace(client):
    res = client.post("/api/dashboard/seed-demo")
    assert res.status_code == 200

    overview = client.get("/api/dashboard/overview").json()
    assert overview["total_projects"] >= 3
    assert overview["total_tasks"] >= 9
    assert len(overview["projects_in_progress"]) >= 1
