import pytest


@pytest.fixture
def activity(client):
    return client.post("/activities/", json={"name": "Running", "points": 10}).json()


@pytest.fixture
def reward(client):
    return client.post("/rewards/", json={"name": "Ice cream", "points_required": 15}).json()


def test_empty_progress(client):
    r = client.get("/progress/summary")
    assert r.status_code == 200
    assert r.json() == {"all_time_points": 0, "current_points": 0}


def test_progress_accumulates_logs(client, activity):
    client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"})
    client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-02"})
    data = client.get("/progress/summary").json()
    assert data["all_time_points"] == 20
    assert data["current_points"] == 20


def test_negative_points_activity(client):
    bad = client.post("/activities/", json={"name": "Junk food", "points": -5}).json()
    client.post("/logs/", json={"activity_id": bad["id"], "date": "2026-01-01"})
    data = client.get("/progress/summary").json()
    assert data["all_time_points"] == -5
    assert data["current_points"] == -5


def test_redemption_reduces_current_points(client, activity, reward):
    client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"})
    client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-02"})
    client.post(f"/redemptions/{reward['id']}/redeem", json={})

    data = client.get("/progress/summary").json()
    assert data["all_time_points"] == 20
    assert data["current_points"] == 5  # 20 - 15


def test_undo_redemption_restores_current_points(client, activity, reward):
    client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"})
    client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-02"})
    redemption = client.post(f"/redemptions/{reward['id']}/redeem", json={}).json()

    client.delete(f"/redemptions/{redemption['id']}")
    data = client.get("/progress/summary").json()
    assert data["current_points"] == 20


def test_deleted_log_excluded_from_progress(client, activity):
    log = client.post("/logs/", json={"activity_id": activity["id"], "date": "2026-01-01"}).json()
    client.delete(f"/logs/{log['id']}")
    data = client.get("/progress/summary").json()
    assert data["all_time_points"] == 0
