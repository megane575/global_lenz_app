from app.api import search as search_api


def test_search_success(client, monkeypatch):
    monkeypatch.setattr(
        search_api,
        "run_search",
        lambda keyword: {"topic_name": keyword, "report": {"country_summaries": []}},
    )

    res = client.post("/api/search", json={"keyword": "  半導体  "})
    assert res.status_code == 200
    assert res.json()["topic_name"] == "半導体"


def test_search_empty_keyword_returns_400(client):
    res = client.post("/api/search", json={"keyword": "   "})
    assert res.status_code == 400
    assert res.json()["detail"] == "キーワードを入力してください"


def test_search_too_long_returns_400(client):
    res = client.post("/api/search", json={"keyword": "a" * 101})
    assert res.status_code == 400
    assert res.json()["detail"] == "キーワードは100文字以内で入力してください"


def test_search_service_exception_returns_500(client, monkeypatch):
    def _raise(_keyword: str):
        raise RuntimeError("boom")

    monkeypatch.setattr(search_api, "run_search", _raise)

    res = client.post("/api/search", json={"keyword": "AI"})
    assert res.status_code == 500
    assert "検索エラー" in res.json()["detail"]
