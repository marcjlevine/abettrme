import pytest


@pytest.fixture
def activity(client):
    return client.post("/activities/", json={"name": "Running", "points": 10}).json()


@pytest.fixture
def log(client, activity):
    return client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"}).json()


def test_create_log_captures_points_snapshot(client, activity):
    r = client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"})
    assert r.status_code == 201
    assert r.json()["points_snapshot"] == 10


def test_points_snapshot_unchanged_after_activity_edit(client, activity, log):
    client.put(f"/activities/{activity['id']}", json={"points": 99})
    r = client.get(f"/logs/{log['id']}")
    assert r.json()["points_snapshot"] == 10


def test_create_log_for_nonexistent_activity_returns_404(client):
    r = client.post("/logs/", json={"activity_id": 999, "date": "2026-01-01"})
    assert r.status_code == 404


def test_create_log_for_deleted_activity_returns_404(client, activity):
    client.delete(f"/activities/{activity['id']}")
    r = client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"})
    assert r.status_code == 404


def test_delete_log(client, log):
    assert client.delete(f"/logs/{log['id']}").status_code == 204
    assert client.get(f"/logs/{log['id']}").status_code == 404


def test_deleted_log_excluded_from_list(client, log):
    client.delete(f"/logs/{log['id']}")
    ids = [l["id"] for l in client.get("/logs/").json()]
    assert log["id"] not in ids


def test_update_log_changing_activity_updates_snapshot(client):
    a1 = client.post("/activities/", json={"name": "Running", "points": 10}).json()
    a2 = client.post("/activities/", json={"name": "Pushups", "points": 5}).json()
    log = client.post("/logs/", json={"activity_id": a1["id"], "date": "2026-01-01"}).json()
    assert log["points_snapshot"] == 10

    r = client.put(f"/logs/{log['id']}", json={"activity_id": a2["id"]})
    assert r.status_code == 200
    assert r.json()["points_snapshot"] == 5
