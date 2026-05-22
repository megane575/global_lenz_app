import json
from openai import OpenAI
from dotenv import load_dotenv
import os
import time
import concurrent.futures
from app.db.repository import get_supabase_client, save_to_db

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_search_queries(keyword: str) -> dict:
    """
    ユーザー入力キーワードから query_en と query_nhk を生成する。
    例: 「イラン核合意」→ {"query_en": "Iran Nuclear", "query_nhk": "イラン 核"}
    """
    prompt = f"""ユーザーが以下のキーワードでニュースを検索しています。
このキーワードに対して、各メディアのRSSを検索するための適切なクエリを生成してください。

キーワード: {keyword}

### query_en（英語メディア向け・GoogleニュースRSS用）
- 「主語となる国・組織名」＋「具体的な事象語」の英語2語のみ
- 例: "Iran Nuclear", "Ukraine Ceasefire", "Hungary Election"

### query_nhk（NHK専用・日本語RSS用）
- NHKの記事タイトルに出てくる自然な日本語2語
- 例: "イラン 核", "ウクライナ 停戦", "ハンガリー 選挙"

### トピック名（日本語・簡潔に）
- ユーザーのキーワードを整形した表示用トピック名

出力は必ず以下のJSON形式のみ:
{{
    "topic_name": "トピック名",
    "query_en": "English 2words",
    "query_nhk": "日本語1 日本語2"
}}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=100,
    )
    return json.loads(response.choices[0].message.content)


def run_search(keyword: str) -> dict:
    """
    ユーザーキーワードから記事取得→要約生成までを実行し結果を返す。
    Redisキャッシュを活用して同じキーワードの再実行を高速化する。
    """
    from app.cache.redis_client import make_cache_key, cache_get, cache_set, TTL_SEARCH_RESULT
    from app.logic.news_service import fetch_media_articles
    from app.logic.ai_service import generate_combined_report
    from app.config import SOURCES

    # --- キャッシュ確認 ---
    cache_key = make_cache_key("search", keyword)
    cached = cache_get(cache_key)
    if cached:
        return cached

    # --- クエリ生成 ---
    queries = generate_search_queries(keyword)
    topic_name = queries.get("topic_name", keyword)
    query_en   = queries.get("query_en", keyword)
    query_nhk  = queries.get("query_nhk", keyword)

    # --- 修正：記事取得を並列化 ---
    media_results = {}

# スレッドプールを作成して同時に実行
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(SOURCES)) as executor:
        # 実行するタスクを登録
        future_to_media = {}
        for media_key in SOURCES.keys():
            query = query_nhk if media_key == "NHK" else query_en
            # fetch_media_articlesを並列実行
            future = executor.submit(fetch_media_articles, media_key, topic_name, query)
            future_to_media[future] = media_key

        # 終わったものから結果を取得
        for future in concurrent.futures.as_completed(future_to_media):
            media_key = future_to_media[future]
            try:
                media_results[media_key] = future.result()
            except Exception as e:
                print(f"  ⚠️ {media_key} の取得失敗: {e}")
                media_results[media_key] = f"取得エラー: {e}"

    # --- AIへのインプット作成（ここは順番を整えるために取得後にループ） ---
    combined_content = ""
    for media_key, info in SOURCES.items():
        result = media_results.get(media_key)
        combined_content += f"【国名: {info['country']}】\n"
        if isinstance(result, dict):
            combined_content += f"メディア名: {result['media']}\nタイトル: {result['title']}\n"
            desc = result.get("description", "").strip()
            if desc: combined_content += f"詳細: {desc}\n"
            combined_content += f"URL: {result['url']}\n\n"
        else:
            combined_content += f"内容: {result}\n\n"

    # --- 要約生成とDB保存（ここはAIの処理待ちが発生します） ---
    # --- 要約生成とDB保存 ---
    report = generate_combined_report(topic_name, combined_content)

    supabase = get_supabase_client()
    topic_id = None
    if supabase:
        try:
            # DB保存実行
            topic_id = save_to_db(supabase, topic_name, media_results, report, True)
        
            # 【重要】DBから今保存したばかりの ID 付きレコードを取得して report に反映させる
            # これにより、フロントの s.country_id に値が入るようになります
            # 保存したばかりのレコードから本物のIDを引く
            res = supabase.table("country_summaries").select("id, media_id, medias(country_name)").eq("topic_id", topic_id).execute()
            
            if res.data:
                # DB上のIDを「国名」で引けるようにマッピング
                # medias(country_name) の階層に注意
                id_map = {item["medias"]["country_name"]: item["id"] for item in res.data}
                
                # report内のサマリーに本物のIDを注入
                for cs in report.get("country_summaries", []):
                    c_name = cs.get("country")
                    real_db_id = id_map.get(c_name)
                    if real_db_id:
                        cs["id"] = real_db_id  # ★フロントの s.id 用
                        cs["country_id"] = real_db_id
                        # もしDBのカラム名が country_summary なら、フロントに合わせて summary に入れ直す
                        if "summary" not in cs and "country_summary" in cs:
                            cs["summary"] = cs["country_summary"]

                print(f"✅ ID注入完了: {id_map}")

            print(f"✅ 検索結果をDB保存(非表示): {topic_name} / ID: {topic_id}")
        except Exception as e:
            print(f"⚠️ DB保存失敗: {e}")

    result_data = {
        "topic_id": topic_id,
        "topic_name": topic_name,
        "query_en": query_en,
        "query_nhk": query_nhk,
        "report": report,
        "media_results": {k: v if isinstance(v, dict) else None for k, v in media_results.items()},
    }

    cache_set(cache_key, result_data, TTL_SEARCH_RESULT)
    return result_data