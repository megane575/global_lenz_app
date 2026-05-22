import os
from datetime import date, timezone
from app.config import SOURCES

# -------------------------------------------------------
# STEP E: DB保存（Supabase）
# -------------------------------------------------------
def get_supabase_client():
    """Supabaseクライアントを初期化して返す"""
    try:
        from supabase import create_client
        url  = os.getenv("SUPABASE_URL")
        key  = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            print("  ⚠️  SUPABASE_URL または SUPABASE_SERVICE_KEY が未設定です")
            return None
        return create_client(url, key)
    except ImportError:
        print("  ⚠️  supabaseパッケージが未インストールです: pip install supabase")
        return None

def upsert_media(supabase, media_key):
    """mediasテーブルにメディアをupsertし、IDを返す"""
    info = SOURCES[media_key]
    data = {
        "media_name":   info["name"],
        "country_name": info["country"],
        "rss_url":      info["top_rss"],
    }
    res = supabase.table("medias").upsert(
        data, on_conflict="media_name"
    ).execute()
    return res.data[0]["id"]


def insert_topic(supabase, topic_name, is_search=False): # 引数にis_searchを追加
    """topicsテーブルにトピックを挿入し、IDを返す"""
    res = supabase.table("topics").insert(
        {"topic_name": topic_name, "is_search": is_search} # is_searchをDBに送る
    ).execute()
    return res.data[0]["id"]

def insert_article(supabase, topic_id, media_id, article_info):
    """
    articlesテーブルに記事を挿入し、IDを返す。
    URLが重複する場合は既存レコードのIDを返す。
    """
    from datetime import datetime, timezone
    url         = article_info.get("url", "")
    title       = article_info.get("article_title", "")
    description = article_info.get("description", "") or ""

    if not url:
        return None

    # published_at のパース（feedparserの文字列 → datetime）
    pub_str = article_info.get("published_at", "")
    try:
        from email.utils import parsedate_to_datetime
        pub_dt = parsedate_to_datetime(pub_str).astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        pub_dt = datetime.utcnow()

    try:
        res = supabase.table("articles").insert({
            "topic_id":     topic_id,
            "media_id":     media_id,
            "title":        title,
            "url":          url,
            "description":  description,
            "published_at": pub_dt.isoformat(),
        }).execute()
        return res.data[0]["id"]
    except Exception as e:
        # URL重複（UNIQUE制約）の場合は既存レコードを取得
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            res = supabase.table("articles").select("id").eq("url", url).execute()
            if res.data:
                return res.data[0]["id"]
        print(f"  ⚠️  article insert失敗: {e}")
        return None


def save_to_db(supabase, topic_name, media_results, report, is_search=False):
    """
    1トピック分のデータをDBに保存する。
    media_results: {media_key: result_dict_or_str}
    report: generate_combined_reportの戻り値（dict）
    """
    from datetime import date

    print(f"  💾 DB保存開始: {topic_name}")

    # 1. トピック登録
    topic_id = insert_topic(supabase, topic_name, is_search=is_search)

    # 2. メディアIDのキャッシュ
    media_id_map = {}
    for media_key in SOURCES:
        media_id_map[media_key] = upsert_media(supabase, media_key)

    today = date.today().isoformat()

    # 3. 各国サマリー保存
    country_summaries = report.get("country_summaries", [])
    # country名 → media_key の逆引きマップ
    country_to_key = {info["country"]: key for key, info in SOURCES.items()}

    for cs in country_summaries:
        country   = cs.get("country", "")
        media_key = country_to_key.get(country)
        if not media_key:
            continue

        media_id   = media_id_map[media_key]
        raw_result = media_results.get(media_key)

        # 記事挿入
        article_id = None
        if isinstance(raw_result, dict):
            article_info = {
                "url":           raw_result.get("url", ""),
                "article_title": raw_result.get("title", ""),
                "description":   raw_result.get("description", ""),
                "published_at":  raw_result.get("published_at", ""),
            }
            article_id = insert_article(supabase, topic_id, media_id, article_info)

        # country_summaries 挿入
        cs_res = supabase.table("country_summaries").insert({
            "topic_id":        topic_id,
            "media_id":        media_id,
            "summary_date":    today,
            "country_summary": cs.get("summary", ""),
            "recommend_score": cs.get("recommend_score", 5),
            "difficult_word": cs.get("difficult_word", []),
        }).execute()

        cs_id = cs_res.data[0]["id"] if cs_res.data else None

        # country_summary_articles 挿入（article_idのUNIQUE制約による重複は無視）
        if cs_id and article_id:
            try:
                supabase.table("country_summary_articles").insert({
                    "country_summary_id": cs_id,
                    "article_id":         article_id,
                }).execute()
            except Exception as e:
                if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                    pass  # 同じ記事が複数トピックに使われる場合は無視
                else:
                    print(f"  ⚠️  country_summary_articles insert失敗: {e}")

    # 4. 横断比較サマリー保存
    comp = report.get("comparison_summary", {})
    comp_res = supabase.table("comparison_summaries").insert({
        "topic_id":          topic_id,
        "summary_date":      today,
        "comparison_summary": comp.get("summary", ""),
        "variance_score":    comp.get("variance_score", 5),
        "difficult_word":    comp.get("difficult_word", []),
    }).execute()

    comp_id = None
    if comp_res.data and len(comp_res.data) > 0:
        comp_id = comp_res.data[0].get("id")

    # comparison_summary_articles: 取得できた記事をすべて紐付け
    if comp_id:
        for media_key, raw_result in media_results.items():
            if not isinstance(raw_result, dict):
                continue
            url = raw_result.get("url", "")
            if not url:
                continue
            art_res = supabase.table("articles").select("id").eq("url", url).execute()
            if art_res.data:
                article_id = art_res.data[0]["id"]
                try:
                    supabase.table("comparison_summary_articles").insert({
                        "comparison_summary_id": comp_id,
                        "article_id":            article_id,
                    }).execute()
                except Exception:
                    pass  # UNIQUE制約による重複は無視

    print(f"  ✅ DB保存完了: topic_id={topic_id}")
    return topic_id