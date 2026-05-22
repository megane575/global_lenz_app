from types import SimpleNamespace

from app.api import comparison_summaries as comparison_api
from app.core.auth import get_current_user_optional
from app.main import app


class _FakeUsersQuery:
    def select(self, _fields):
        return self

    def eq(self, _key, _value):
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return SimpleNamespace(data={"id": "public-99"})


class _FakeSupabase:
    def table(self, _name):
        return _FakeUsersQuery()


def test_comparison_detail_success(client, monkeypatch):
    app.dependency_overrides[get_current_user_optional] = lambda: {"sub": "auth-1"}
    monkeypatch.setattr(comparison_api, "supabase", _FakeSupabase())

    captured = {}

    def _fake_get_comparison_detail(summary_id, public_user_id):
        captured["args"] = (summary_id, public_user_id)
        return {"comparison_id": summary_id, "topic_name": "比較テーマ"}

    monkeypatch.setattr(comparison_api, "get_comparison_detail", _fake_get_comparison_detail)

    res = client.get("/api/comparison-summaries/7/detail")
    assert res.status_code == 200
    assert captured["args"] == (7, "public-99")
    assert res.json()["comparison_id"] == 7


def test_comparison_detail_404(client, monkeypatch):
    monkeypatch.setattr(comparison_api, "get_comparison_detail", lambda _id, _uid: None)
    res = client.get("/api/comparison-summaries/404/detail")
    assert res.status_code == 404
    assert res.json()["detail"] == "Comparison not found"
