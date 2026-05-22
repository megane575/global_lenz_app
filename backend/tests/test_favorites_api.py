from types import SimpleNamespace

from app.api import favorites as favorites_api


class _FakeDeleteQuery:
    def __init__(self):
        self.filters = {}

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def execute(self):
        return SimpleNamespace(data=[{"deleted": True, "filters": self.filters}])


class _FakeTableQuery:
    def __init__(self, table_name):
        self.table_name = table_name
        self._auth_id = None

    def select(self, _fields):
        return self

    def eq(self, key, value):
        if key == "auth_user_id":
            self._auth_id = value
        return self

    def maybe_single(self):
        return self

    def delete(self):
        return _FakeDeleteQuery()

    def execute(self):
        if self.table_name == "users":
            return SimpleNamespace(data={"id": "public-1"})
        return SimpleNamespace(data=[])


class _FakeSupabase:
    def table(self, table_name):
        return _FakeTableQuery(table_name)


def test_read_favorites(client, monkeypatch, override_auth_user):
    monkeypatch.setattr(favorites_api, "get_public_user_id", lambda _auth_id: "public-1")
    monkeypatch.setattr(
        favorites_api,
        "get_favorites",
        lambda user_id: [{"favorite_id": 1, "user_id": user_id}],
    )

    res = client.get("/api/favorites/")
    assert res.status_code == 200
    assert res.json()[0]["user_id"] == "public-1"


def test_add_favorite(client, monkeypatch, override_auth_user):
    monkeypatch.setattr(favorites_api, "get_public_user_id", lambda _auth_id: "public-1")
    monkeypatch.setattr(favorites_api, "create_favorite", lambda data: [data])

    res = client.post("/api/favorites/", json={"country_summary_id": 3})
    assert res.status_code == 200
    payload = res.json()[0]
    assert payload["country_summary_id"] == 3
    assert payload["user_id"] == "public-1"


def test_remove_favorite_by_country_id(client, monkeypatch, override_auth_user):
    monkeypatch.setattr(favorites_api, "supabase", _FakeSupabase())

    res = client.delete("/api/favorites/?country_summary_id=9")
    assert res.status_code == 200
    assert res.json()[0]["deleted"] is True
    assert res.json()[0]["filters"]["country_summary_id"] == 9


def test_read_favorites_with_summaries(client, monkeypatch, override_auth_user):
    monkeypatch.setattr(favorites_api, "get_public_user_id", lambda _auth_id: "public-1")
    monkeypatch.setattr(
        favorites_api,
        "get_favorites_with_summaries",
        lambda _public_id: [{"favorite_id": 9, "type": "comparison"}],
    )

    res = client.get("/api/favorites/with-summaries")
    assert res.status_code == 200
    assert res.json() == [{"favorite_id": 9, "type": "comparison"}]
