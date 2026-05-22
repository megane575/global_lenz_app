import os
import json
import hashlib
import redis
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_redis_client():
    """Redisクライアントをシングルトンで返す"""
    global _client
    if _client is not None:
        return _client
    try:
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", 6379))
        password = os.getenv("REDIS_PASSWORD", None)
        _client = redis.Redis(
            host=host,
            port=port,
            password=password,
            decode_responses=True,
            socket_connect_timeout=3,
        )
        _client.ping()  # 接続確認
        print("  ✅ Redis接続成功")
        return _client
    except Exception as e:
        print(f"  ⚠️  Redis接続失敗（キャッシュなしで続行）: {e}")
        return None


def make_cache_key(*args) -> str:
    """引数からキャッシュキーを生成"""
    raw = ":".join(str(a) for a in args)
    return "globallenz:" + hashlib.md5(raw.encode()).hexdigest()


def cache_get(key: str):
    """キャッシュから値を取得。存在しない場合はNone"""
    r = get_redis_client()
    if r is None:
        return None
    try:
        val = r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


def cache_set(key: str, value, ttl_seconds: int):
    """キャッシュに値を保存"""
    r = get_redis_client()
    if r is None:
        return
    try:
        r.setex(key, ttl_seconds, json.dumps(value, ensure_ascii=False))
    except Exception as e:
        print(f"  ⚠️  キャッシュ保存失敗: {e}")


def cache_delete_pattern(pattern: str):
    """パターンに一致するキャッシュを全削除（バッチ更新時に使用）"""
    r = get_redis_client()
    if r is None:
        return
    try:
        keys = r.keys(f"globallenz:{pattern}*")
        if keys:
            r.delete(*keys)
            print(f"  🗑️  キャッシュ削除: {len(keys)}件 (pattern: {pattern})")
    except Exception as e:
        print(f"  ⚠️  キャッシュ削除失敗: {e}")


# TTL定数（秒）
TTL_GOOGLE_NEWS   = 60 * 60 * 2    # Googleニュース検索結果: 2時間
TTL_URL_DECODE    = 60 * 60 * 24   # URL変換結果: 24時間
TTL_API_RESPONSE  = 60 * 60 * 20   # APIレスポンス: 20時間（翌朝バッチまで）
TTL_SEARCH_RESULT = 60 * 60 * 6    # ユーザー検索結果: 6時間