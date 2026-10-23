def test_activity_logging_on_project_and_task_lifecycle(client):
    # Create project
    p = client.post("/api/projects", json={"name": "Activity Test Project", "color": "#7257E8"}).json()
    pid = p["id"]

    # Check activity list
    act1 = client.get("/api/activity").json()
    assert len(act1) >= 1
    assert any(a["event_type"] == "project_created" and "Activity Test Project" in a["description"] for a in act1)

    # Create task
    t = client.post(
        "/api/tasks",
        json={"title": "Important Spec", "project_id": pid, "status": "todo", "priority": "urgent"},
    ).json()

    act2 = client.get("/api/activity").json()
    assert any(a["event_type"] == "task_created" and "Important Spec" in a["description"] for a in act2)

    # Move task status to done
    client.patch(f"/api/tasks/{t['id']}/status", json={"status": "done"})
    act3 = client.get("/api/activity").json()
    assert any(a["event_type"] == "task_completed" for a in act3)
