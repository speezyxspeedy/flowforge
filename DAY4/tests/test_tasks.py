from datetime import date, timedelta


def test_create_task_under_project(client):
    p = client.post("/api/projects", json={"name": "Sprint 1", "color": "#7257E8"}).json()
    project_id = p["id"]

    task_payload = {
        "title": "Set up database migrations",
        "description": "Configure SQLite and models",
        "status": "todo",
        "priority": "high",
        "due_date": date.today().isoformat(),
        "label": "Backend",
        "project_id": project_id,
    }
    response = client.post("/api/tasks", json=task_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Set up database migrations"
    assert data["project_id"] == project_id
    assert data["project_name"] == "Sprint 1"
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["completed_at"] is None


def test_create_task_invalid_project(client):
    response = client.post(
        "/api/tasks",
        json={"title": "Orphan Task", "project_id": 99999, "status": "todo", "priority": "low"},
    )
    assert response.status_code == 404


def test_task_status_update_and_completed_at(client):
    p = client.post("/api/projects", json={"name": "Sprint 2", "color": "#7257E8"}).json()
    t = client.post(
        "/api/tasks",
        json={"title": "Test Status Move", "project_id": p["id"], "status": "todo", "priority": "medium"},
    ).json()
    task_id = t["id"]

    # Move to in_progress
    move_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "in_progress", "position": 1})
    assert move_res.status_code == 200
    assert move_res.json()["status"] == "in_progress"
    assert move_res.json()["completed_at"] is None

    # Move to done
    done_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "done"})
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "done"
    assert done_res.json()["completed_at"] is not None

    # Revert to todo
    revert_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "todo"})
    assert revert_res.status_code == 200
    assert revert_res.json()["status"] == "todo"
    assert revert_res.json()["completed_at"] is None


def test_task_priority_update(client):
    p = client.post("/api/projects", json={"name": "Sprint 3", "color": "#7257E8"}).json()
    t = client.post(
        "/api/tasks",
        json={"title": "Priority Test", "project_id": p["id"], "status": "todo", "priority": "low"},
    ).json()

    patch_res = client.patch(f"/api/tasks/{t['id']}/priority", json={"priority": "urgent"})
    assert patch_res.status_code == 200
    assert patch_res.json()["priority"] == "urgent"


def test_task_filtering_and_due_state(client):
    p = client.post("/api/projects", json={"name": "Filter Project", "color": "#7257E8"}).json()
    pid = p["id"]
    today = date.today()

    # Create 3 tasks with different due dates
    client.post(
        "/api/tasks",
        json={
            "title": "Overdue Task",
            "project_id": pid,
            "status": "todo",
            "priority": "high",
            "due_date": (today - timedelta(days=2)).isoformat(),
        },
    )
    client.post(
        "/api/tasks",
        json={
            "title": "Today Task",
            "project_id": pid,
            "status": "todo",
            "priority": "medium",
            "due_date": today.isoformat(),
        },
    )
    client.post(
        "/api/tasks",
        json={
            "title": "Future Task",
            "project_id": pid,
            "status": "todo",
            "priority": "low",
            "due_date": (today + timedelta(days=5)).isoformat(),
        },
    )

    # Filter overdue
    overdue_res = client.get("/api/tasks?due_filter=overdue")
    assert overdue_res.status_code == 200
    assert len(overdue_res.json()) == 1
    assert overdue_res.json()[0]["title"] == "Overdue Task"
    assert overdue_res.json()[0]["is_overdue"] is True

    # Filter today
    today_res = client.get("/api/tasks?due_filter=today")
    assert today_res.status_code == 200
    assert len(today_res.json()) == 1
    assert today_res.json()[0]["title"] == "Today Task"

    # Filter upcoming
    upcoming_res = client.get("/api/tasks?due_filter=upcoming")
    assert upcoming_res.status_code == 200
    assert len(upcoming_res.json()) == 1
    assert upcoming_res.json()[0]["title"] == "Future Task"


def test_delete_task(client):
    p = client.post("/api/projects", json={"name": "Del Task Project", "color": "#7257E8"}).json()
    t = client.post(
        "/api/tasks",
        json={"title": "To be removed", "project_id": p["id"], "status": "todo", "priority": "low"},
    ).json()

    del_res = client.delete(f"/api/tasks/{t['id']}")
    assert del_res.status_code == 200
    assert client.get(f"/api/tasks/{t['id']}").status_code == 404
