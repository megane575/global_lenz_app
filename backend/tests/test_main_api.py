from app.core.auth import get_current_user, get_current_user_optional
from app.main import app


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Backendが動きました" in res.json()["message"]


def test_me_endpoint_with_dependency_override(client):
    app.dependency_overrides[get_current_user] = lambda: {"id": "u1", "email": "u@example.com"}
    res = client.get("/api/me")
    assert res.status_code == 200
    assert res.json()["id"] == "u1"


def test_optional_endpoint_without_user(client):
    app.dependency_overrides[get_current_user_optional] = lambda: None
    res = client.get("/test-optional")
    assert res.status_code == 200
    assert res.json()["user"] is None
