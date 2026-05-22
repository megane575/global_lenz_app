from typing import Optional

from app.db.supabase import supabase
from app.services.favorite_service import (
    get_user_favorite_ids
)
from app.services.user_service import (
    get_public_user_id
)

def get_country_summaries():

    response = (
        supabase
        .table("country_summaries")
        .select("*")
        .limit(20)
        .execute()
    )

    return response.data

def get_country_summary_by_id(summary_id: int):

    response = supabase.table(
        "country_summaries"
    ).select("*").eq(
        "id", summary_id
    ).execute()

    return response.data

def get_country_detail(country_id: int, public_user_id: Optional[str] = None):

    response = (
        supabase
        .table("country_summaries")
        .select(
            """
            id,
            topic_id,
            media_id,
            created_at,
            country_summary,
            difficult_word,

            topics (
                topic_name
            ),

            medias (
                country_name,
                media_name
            )
            """
        )
        .eq("id", country_id)
        .maybe_single()
        .execute()
    )

    data = response.data

    if not data:
        return None

    topic_id = data["topic_id"]
    media_id = data["media_id"]

    # article URL取得

    article_res = (
        supabase
        .table("articles")
        .select("url")
        .eq("topic_id", topic_id)
        .eq("media_id", media_id)
        .limit(1)
        .execute()
    )

    url = article_res.data[0]["url"] if article_res.data else None

     # favorites判定

    is_already_saved = False

    if public_user_id:

        fav = (
            supabase
            .table("favorites")
            .select("id")
            .eq("user_id", public_user_id)
            .eq("country_summary_id", country_id)
            .limit(1)
            .maybe_single()
            .execute()
        )

        if fav and fav.data:
            is_already_saved = True

    return {

        "country_id":
            data["id"],

        "created_at":
            data["created_at"],

        "topic_name":
            data["topics"]["topic_name"],

        "country_name":
            data["medias"]["country_name"],

        "media_name":
            data["medias"]["media_name"],
        
        "difficult_word":
        data["difficult_word"],

        "summary":
            data["country_summary"],

        "url":
            url,

        "is_already_saved": 
            is_already_saved
    }

def get_home_country_summaries(is_login: bool,auth_user_id: str | None):

    favorite_ids = set()

    if is_login and auth_user_id:

        public_user_id = get_public_user_id(
            auth_user_id
        )

        favorite_ids = get_user_favorite_ids(
            public_user_id
        )

    response = (
        supabase
        .table("topics")
        .select(
            """
            id,
            topic_name,
            created_at,
            comparison_summaries (
                id,
                comparison_summary_articles (
                    id
                )
            ),

            country_summaries (
                id,
                country_summary,
                recommend_score,

                medias (
                    country_name
                )
            )
            """
        )
        .is_("is_search", False)
        .order("created_at", desc=True)
        .limit(6)
        .execute()
    )

    data = response.data

    results = []

    for topic in data:

        summaries = []

        for cs in topic["country_summaries"]:

            text = cs["country_summary"]

            # preview制御
            if not is_login:

                preview = text[:120]

                summary_text = preview + "..."
                locked = True

            else:

                summary_text = text
                locked = False

            summaries.append({
                "id": cs["id"],
                "country_name": cs["medias"]["country_name"],
                "summary": summary_text,
                "recommend_score": cs["recommend_score"],
                "locked": locked,
                "is_favorited": cs["id"] in favorite_ids
            })
        
        comp_id = None
        is_comparison_favoritable = False

        if (
            "comparison_summaries" in topic 
            and len(topic["comparison_summaries"]) > 0
        ):
            # 最初の1件のIDを取得
            comp = topic["comparison_summaries"][0]
            comp_id = comp["id"]

            articles = comp.get("comparison_summary_articles")

            if articles:
                is_comparison_favoritable = True
                        
        results.append({

            "topic_id": topic["id"],

            "topic_name": topic["topic_name"],

            "comparison_id": comp_id,

            "is_comparison_favoritable": is_comparison_favoritable,

            "created_at": topic["created_at"],

            "summaries": summaries

        })

    return results