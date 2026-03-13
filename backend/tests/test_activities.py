import pytest


@pytest.fixture
def activity(client):
    return client.post("/activities/", json={"name": "Running", "points": 10}).json()


def test_create_activity(client):
    r = client.post("/activities/", json={"name": "Running", "points": 10})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Running"
    assert data["points"] == 10


def test_list_activities(client):
    client.post("/activities/", json={"name": "Running", "points": 10})
    client.post("/activities/", json={"name": "Pushups", "points": 5})
    r = client.get("/activities/")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_activity(client, activity):
    r = client.get(f"/activities/{activity['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == activity["id"]


def test_get_nonexistent_activity_returns_404(client):
    assert client.get("/activities/999").status_code == 404


def test_update_activity(client, activity):
    r = client.put(f"/activities/{activity['id']}", json={"points": 20})
    assert r.status_code == 200
    assert r.json()["points"] == 20


def test_delete_activity(client, activity):
    assert client.delete(f"/activities/{activity['id']}").status_code == 204


def test_deleted_activity_excluded_from_list(client, activity):
    client.delete(f"/activities/{activity['id']}")
    ids = [a["id"] for a in client.get("/activities/").json()]
    assert activity["id"] not in ids


def test_get_deleted_activity_returns_404(client, activity):
    client.delete(f"/activities/{activity['id']}")
    assert client.get(f"/activities/{activity['id']}").status_code == 404
