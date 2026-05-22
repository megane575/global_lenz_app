import feedparser
import urllib.parse
import time
from googlenewsdecoder import gnewsdecoder
from app.config import SOURCES, GOOGLE_SOURCE_FILTERS, MEDIA_DOMAINS
from app.logic.ai_service import is_article_relevant
from app.cache.redis_client import (
    make_cache_key, cache_get, cache_set,
    TTL_GOOGLE_NEWS, TTL_URL_DECODE,
)

# -------------------------------------------------------
# STEP A: トレンド見出し収集
# -------------------------------------------------------
def collect_headlines():
    """各メディアのRSSから最新見出しを収集する"""
    all_headlines = ""
    for key, info in SOURCES.items():
        feed = feedparser.parse(info["top_rss"])
        # ▼ 修正①: bozo フラグでパースエラーを検知
        if feed.bozo:
            print(f"  ⚠️  [{key}] RSSの取得/パースに失敗しました: {feed.bozo_exception}")
            continue
        headlines = [e.title for e in feed.entries[:15]]
        all_headlines += f"--- {info['country']} ---\n" + "\n".join(headlines) + "\n"
    return all_headlines

# -------------------------------------------------------
# STEP C: 各メディアから記事を取得
# -------------------------------------------------------
def fetch_nhk_article(query_ja):
    """
    NHK公式RSS（国際ニュース）からキーワードマッチで記事を探す。
    ▼ 修正②: GoogleニュースのNHKソースフィルターは廃止し、公式RSSを直接利用。
    """
    rss_url = "https://www.nhk.or.jp/rss/news/cat6.xml"
    feed = feedparser.parse(rss_url)

    if feed.bozo:
        print(f"  ⚠️  [NHK] RSSの取得/パースに失敗: {feed.bozo_exception}")
        return None

    keywords = query_ja.replace("　", " ").split()
    and_match = None   # 全キーワード一致した最初の記事
    or_match  = None   # いずれか1語一致した最初の記事

    for entry in feed.entries:
        title   = entry.get("title", "")
        summary = entry.get("summary", "")
        text    = title + summary
        matched = [kw for kw in keywords if kw in text]
        if len(matched) == len(keywords):
            # 全キーワード一致 → 即採用
            and_match = entry
            break
        elif matched and or_match is None:
            # 1語以上一致 → 候補として保持
            or_match = entry

    best = and_match or or_match
    if best is None:
        return None

    match_type = "AND" if and_match else "OR(部分一致)"
    print(f"  [NHK] マッチ種別: {match_type}")
    return {
        "title":        best.get("title", ""),
        "description":  best.get("summary", ""),   # RSSのsummaryがdescription
        "media":        "NHK NEWS WEB",
        "url":          best.link,
        "published_at": best.get("published", "不明"),
    }


def _decode_url(long_url):
    """
    GoogleニュースのリダイレクトURLを元のURLに変換する。
    同じURLは24時間キャッシュする。
    """
    key = make_cache_key("url_decode", long_url)
    cached = cache_get(key)
    if cached:
        return cached

    try:
        decoded = gnewsdecoder(long_url)
        final_url = decoded["decoded_url"] if decoded.get("status") else long_url
    except Exception:
        final_url = long_url

    cache_set(key, final_url, TTL_URL_DECODE)
    return final_url

def _entry_to_dict(entry, media_key):
    """feedparserのエントリを辞書に変換する"""
    return {
        "title":        entry.title,
        "description":  entry.get("summary", ""),   # RSSのsummaryがdescription
        "media":        entry.source.get("title", SOURCES[media_key]["name"]),
        "url":          _decode_url(entry.link),
        "published_at": entry.get("published", "不明"),
    }

def _is_expected_source(result, media_key):
    """取得記事の出典URLが期待するメディアのドメインと一致するか確認"""
    domains = MEDIA_DOMAINS.get(media_key, [])
    if not domains:
        return True  # ドメイン定義がないメディアはチェックしない
    url = result.get("url", "")
    return any(domain in url for domain in domains)

def fetch_google_news_article(media_key, query_en, topic_name):
    """
    GoogleニュースRSSから記事を1件取得する。
    同じ media_key + query_en の組み合わせは2時間キャッシュする。

    戦略:
    1. ソースフィルター付きで検索 → ヒットしたらそのまま返す
    2. フィルターなしで上位5件取得 → 期待ドメイン一致 かつ 関連性チェックOKの記事を採用
    3. 一致する記事がなければ None を返す（別メディアの記事を誤って採用しない）
    """
    # --- キャッシュ確認 ---
    key = make_cache_key("gnews", media_key, query_en)
    cached = cache_get(key)
    if cached:
        print(f"  [{media_key}] キャッシュヒット: {query_en!r}")
        return cached

    source_filter = GOOGLE_SOURCE_FILTERS.get(media_key, "")
    time_filter = "when:7d"

    # --- 第1試行: ソースフィルター付き ---
    if source_filter:
        encoded_query = urllib.parse.quote(f"{query_en} {source_filter} {time_filter}")
        url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)
        if not feed.bozo and feed.entries:
            result = _entry_to_dict(feed.entries[0], media_key)
            cache_set(key, result, TTL_GOOGLE_NEWS)
            return result
        print(f"  [{media_key}] ソースフィルター付き検索でヒットなし → フィルターなしで再試行")

    # --- 第2試行: フィルターなし・上位5件からドメイン一致＋関連性チェックで選ぶ ---
    encoded_query = urllib.parse.quote(f"{query_en} {time_filter}")
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    feed = feedparser.parse(url)
    if feed.bozo or not feed.entries:
        return None

    for entry in feed.entries[:5]:
        candidate = _entry_to_dict(entry, media_key)
        if not _is_expected_source(candidate, media_key):
            continue
        if is_article_relevant(media_key, topic_name, candidate["title"], query_en):
            print(f"  [{media_key}] フォールバックで適合記事を発見")
            cache_set(key, candidate, TTL_GOOGLE_NEWS)
            return candidate
        else:
            print(f"  [{media_key}] フォールバック候補が関連性チェックで除外: {candidate['title'][:60]}")

    print(f"  [{media_key}] フォールバックでも適合記事なし → スキップ")
    return None

def fetch_media_articles(media_key, topic_name, query):
    """
    メディアごとに記事を取得し、関連性チェックを行う。
    NHKは公式RSS直接、それ以外はGoogleニュース経由。
    フォールバック時の関連性チェックは fetch_google_news_article 内で実施済みのため
    ここでは第1試行（ソースフィルター付き）の結果のみ再チェックする。
    """
    if media_key == "NHK":
        result = fetch_nhk_article(query)
        needs_relevance_check = True
    else:
        result = fetch_google_news_article(media_key, query, topic_name)
        # フォールバック経由の記事は内部で関連性チェック済み。
        # ソースフィルター経由の記事はまだチェックしていないので後でチェックする。
        # どちら経由かを区別する手段がないため、全件チェックする（コストは小さい）。
        needs_relevance_check = True

    if result:
        print(f"  [{media_key}] query: {query!r}")
        print(f"  [{media_key}] hit  : {result['title']}")

        if needs_relevance_check:
            if not is_article_relevant(media_key, topic_name, result["title"], query):
                print(f"  [{media_key}] ⚠️  関連性なしと判定 → スキップ")
                return "※関連ニュースなし（関連性チェックで除外）"
    else:
        print(f"  [{media_key}] query: {query!r}")
        print(f"  [{media_key}] hit  : なし")
        return "※関連ニュースなし"

    return result