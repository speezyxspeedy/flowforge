from datetime import date


def test_calendar_queries_and_unscheduled(client):
    p = client.post("/api/projects", json={"name": "Calendar Project", "color": "#7257E8"}).json()
    pid = p["id"]

    # Scheduled task
    client.post(
        "/api/tasks",
        json={
            "title": "Scheduled Deadline",
            "project_id": pid,
            "status": "todo",
            "priority": "high",
            "due_date": "2026-05-15",
        },
    )
    # Unscheduled task
    client.post(
        "/api/tasks",
        json={
            "title": "Backlog item no date",
            "project_id": pid,
            "status": "todo",
            "priority": "low",
        },
    )

    # Query unscheduled
    res_unscheduled = client.get("/api/tasks?due_filter=unscheduled")
    assert res_unscheduled.status_code == 200
    assert len(res_unscheduled.json()) == 1
    assert res_unscheduled.json()[0]["title"] == "Backlog item no date"

    # Query all tasks for calendar mapping
    all_res = client.get("/api/tasks")
    assert all_res.status_code == 200
    assert len(all_res.json()) == 2


def test_csv_export_format_and_formula_injection_defense(client):
    p = client.post("/api/projects", json={"name": "Security Proj", "color": "#7257E8"}).json()
    pid = p["id"]

    # Potentially malicious title starting with formula trigger '='
    client.post(
        "/api/tasks",
        json={
            "title": "=cmd|' /C calc'!A0",
            "description": "+SUM(A1:A10)",
            "project_id": pid,
            "status": "todo",
            "priority": "medium",
            "due_date": date.today().isoformat(),
        },
    )

    res = client.get("/api/tasks/export/csv")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    csv_text = res.text

    # Header check
    assert "Task ID,Project,Title,Description,Status,Priority,Due Date" in csv_text

    # Security check: the formula symbols must have been prefixed with single quote
    assert "'=cmd|' /C calc'!A0" in csv_text
    assert "'+SUM(A1:A10)" in csv_text
