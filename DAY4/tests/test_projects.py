def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "FlowForge"


def test_create_and_get_project(client):
    payload = {
        "name": "Design System Launch",
        "description": "Establish core tokens and components",
        "color": "#7257E8",
        "status": "active",
        "start_date": "2026-04-01",
        "due_date": "2026-05-01",
    }
    response = client.post("/api/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "Design System Launch"
    assert data["color"] == "#7257E8"
    assert data["task_counts"]["total"] == 0
    assert data["completion_rate"] == 0.0

    # Get by ID
    project_id = data["id"]
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Design System Launch"


def test_project_validation(client):
    # Empty name fails validation
    response = client.post("/api/projects", json={"name": "", "color": "#7257E8"})
    assert response.status_code == 422

    # Invalid hex color fails validation
    response = client.post("/api/projects", json={"name": "Bad Color", "color": "not-a-color"})
    assert response.status_code == 422


def test_update_project(client):
    create_res = client.post(
        "/api/projects", json={"name": "Initial Name", "description": "Draft", "color": "#7257E8"}
    )
    project_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/projects/{project_id}",
        json={"name": "Updated Name", "description": "Polished text"},
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "Polished text"


def test_archive_project(client):
    create_res = client.post("/api/projects", json={"name": "To Archive", "color": "#7257E8"})
    project_id = create_res.json()["id"]

    # Archive
    archive_res = client.post(f"/api/projects/{project_id}/archive?archive=true")
    assert archive_res.status_code == 200
    assert archive_res.json()["status"] == "archived"

    # Default list should exclude archived
    list_res = client.get("/api/projects")
    assert len(list_res.json()) == 0

    # Explicit list of archived
    archived_list = client.get("/api/projects?status=archived")
    assert len(archived_list.json()) == 1

    # Unarchive
    unarchive_res = client.post(f"/api/projects/{project_id}/archive?archive=false")
    assert unarchive_res.status_code == 200
    assert unarchive_res.json()["status"] == "active"


def test_delete_project_cascades_tasks(client):
    # Create project
    p_res = client.post("/api/projects", json={"name": "Project to Delete", "color": "#7257E8"})
    project_id = p_res.json()["id"]

    # Add task to it
    t_res = client.post(
        "/api/tasks",
        json={"title": "Cascade Task", "project_id": project_id, "status": "todo", "priority": "medium"},
    )
    task_id = t_res.json()["id"]

    # Delete project
    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 200

    # Project should be 404
    assert client.get(f"/api/projects/{project_id}").status_code == 404
    # Task should be gone due to CASCADE
    assert client.get(f"/api/tasks/{task_id}").status_code == 404


def test_get_nonexistent_project_returns_404(client):
    response = client.get("/api/projects/99999")
    assert response.status_code == 404
