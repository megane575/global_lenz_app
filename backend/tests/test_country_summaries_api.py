from types import SimpleNamespace

from app.api import country_summaries as country_api
from app.core.auth import get_current_user_optional
from app.main import app


class _FakeUsersQuery:
    def __init__(self):
        self._auth_id = None

    def select(self, _fields):
        return self

    def eq(self, key, value):
        if key == "auth_user_id":
            self._auth_id = value
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return SimpleNamespace(data={"id": "public-1"} if self._auth_id else None)


class _FakeSupabase:
    def table(self, _name):
        return _FakeUsersQuery()


def test_country_home_anonymous(client, monkeypatch):
    app.dependency_overrides[get_current_user_optional] = lambda: None
    called = {}

    def _fake_get_home_country_summaries(is_login, auth_user_id):
        called["args"] = (is_login, auth_user_id)
        return [{"topic_id": 1, "topic_name": "T"}]

    monkeypatch.setattr(country_api, "get_home_country_summaries", _fake_get_home_country_summaries)

    res = client.get("/api/country-summaries/home")
    assert res.status_code == 200
    assert res.json()["is_login"] is False
    assert called["args"] == (False, None)


def test_country_summary_404_when_not_found(client, monkeypatch):
    monkeypatch.setattr(country_api, "get_country_summary_by_id", lambda _id: None)
    res = client.get("/api/country-summaries/123")
    assert res.status_code == 404
    assert res.json()["detail"] == "Country summary not found"


def test_country_detail_with_logged_in_user_resolves_public_user_id(client, monkeypatch):
    app.dependency_overrides[get_current_user_optional] = lambda: {"sub": "auth-1"}
    monkeypatch.setattr(country_api, "supabase", _FakeSupabase())

    captured = {}

    def _fake_get_country_detail(summary_id, public_user_id):
        captured["args"] = (summary_id, public_user_id)
        return {"country_id": summary_id, "is_already_saved": True}

    monkeypatch.setattr(country_api, "get_country_detail", _fake_get_country_detail)

    res = client.get("/api/country-summaries/10/detail")
    assert res.status_code == 200
    assert captured["args"] == (10, "public-1")
    assert res.json()["country_id"] == 10
