from fastapi import APIRouter, HTTPException

from app.db.repository import get_supabase_client
from app.cache.redis_client import (
    make_cache_key, cache_get, cache_set, TTL_API_RESPONSE,
)

router = APIRouter()

@router.get("/today")
def get_today_topics():
    cache_key = make_cache_key("topics_latest")

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="DB接続エラー")

    try:
        # tryの後は必ず字下げ（スペース4つ）が必要です
        res = (
            supabase.table("topics")
            .select("""
                id, 
                topic_name, 
                created_at, 
                country_summaries(
                    id,
                    country_summary,
                    recommend_score,
                    medias(country_name)
                )
            """) 
            .is_("is_search", False)
            .order("created_at",desc=True)
            .limit(6)
            .execute()
        )

        raw_topics = res.data or []
        formatted_topics = []

        for t in raw_topics:
            formatted_topics.append({
                "topic_id": t.get("id"),
                "topic_name": t.get("topic_name"),
                "summaries": t.get("country_summaries") or []
            })
            
        cache_set(cache_key, formatted_topics, TTL_API_RESPONSE)
        return {"source": "db",  "topics": formatted_topics}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{topic_id}")
def get_topic_detail(topic_id: int):
    supabase = get_supabase_client()
    topic_res = supabase.table("topics").select("*").eq("id", topic_id).execute()
    topic = topic_res.data[0]
    
    cs_res = (
        supabase.table("country_summaries")
        .select("*, medias(media_name, country_name), country_summary_articles(articles(title, url, description))")
        .eq("topic_id", topic_id)
        .execute()
    )
    comp_res = (
        supabase.table("comparison_summaries")
        .select("*")
        .eq("topic_id", topic_id)
        .execute()
    )

    return {
        "topic": topic,
        "country_summaries": cs_res.data or [],
        "comparison_summary": comp_res.data[0] if comp_res.data else None,
    }