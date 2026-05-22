from typing import Optional

from app.db.supabase import supabase

#　比較要約一覧を取得
def get_comparison_summaries():

    response = (
        supabase
        .table("comparison_summaries")
        .select("*")
        .limit(20)
        .execute()
    )

    return response.data

# 比較要約を1件だけ取得する
def get_comparison_summary_by_id(summary_id: int):

    response = (
        supabase
        .table("comparison_summaries")
        .select("*")
        .eq("id", summary_id)
        .single()
        .execute()
    )
    return response.data

# 比較要約詳細画面の表示
def get_comparison_detail(comparison_id: int, public_user_id: Optional[str] = None):

    response = (
        supabase
        .table("comparison_summaries")
        .select(
                """
            id,
            topic_id,
            created_at,
            variance_score,
            comparison_summary,
            difficult_word,

            topics (
                topic_name,

                country_summaries (
                    topic_id,
                    media_id,
                    country_summary,

                    medias (
                        country_name,
                        media_name
                    )
                )
            )
            """
        )
        .eq("id", comparison_id)
        .maybe_single()
        .execute()
    )

    data = response.data

    if not data:
        return None

    topic_id = data["topic_id"]

    real_comparison_id = data["id"]

    result_countries = []

   # topics 内に country が入っている
    topic = data.get("topics") or {}
    country_list = topic.get("country_summaries") or []

    for c in country_list:

        media_id = c["media_id"]

        article_res = (
            supabase
            .table("articles")
            .select("url")
            .eq("topic_id", topic_id)
            .eq("media_id", media_id)
            .limit(1)
            .maybe_single()
            .execute()
        )

        url = article_res.data["url"] if article_res and article_res.data else None

        media = c.get("medias") or {}

        result_countries.append({
            "country_name":
                media.get("country_name"),

            "media_name":
                media.get("media_name"),

            "summary":
                c.get("country_summary"),

            "url":
                url
        })
    
     # 保存済み判定
    is_already_saved = False

    if public_user_id:

        favorite_check = (
            supabase
            .table("favorites")
            .select("id")
            .eq("user_id", public_user_id)
            .eq("comparison_summary_id", real_comparison_id)
            .limit(1)
            .maybe_single()
            .execute()
        )

        if favorite_check and favorite_check.data:
            is_already_saved = True

    return {

        "comparison_id":
            real_comparison_id,

        "created_at":
            data["created_at"],

        "topic_name":
            (data.get("topics") or {}).get("topic_name"),

        "variance_score":
            data["variance_score"],

        "comparison_summary":
            data["comparison_summary"],
        
        "difficult_word":
        data["difficult_word"],

        "country_summaries":
            result_countries,

        "is_already_saved":
            is_already_saved
    }
