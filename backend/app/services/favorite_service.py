from app.db.supabase import supabase
from fastapi import HTTPException

# ネタ帳取得関数
def get_favorites(user_id: str):

    response = supabase.table(
        "favorites"
    ).select("*").eq(
        "user_id", user_id
    ).execute()

    return response.data

# ネタ帳登録関数
def create_favorite(data: dict):

    user_id = data.get("user_id")

    country_summary_id = data.get(
        "country_summary_id"
    )

    comparison_summary_id = data.get(
        "comparison_summary_id"
    )

    query = (
        supabase.table("favorites")
        .select("id")
        .eq("user_id", user_id)
    )

    # country の場合
    if country_summary_id:

        query = query.eq(
            "country_summary_id",
            country_summary_id
        )

    # comparison の場合
    elif comparison_summary_id:

        # comparison保存可能チェック
        article_check = (
            supabase
            .table("comparison_summary_articles")
            .select("id")
            .eq(
                "comparison_summary_id",
                comparison_summary_id
            )
            .execute()
        )

        # article が存在しない場合は拒否
        if not article_check.data:

            raise HTTPException(
                status_code=400,
                detail="この比較要約は保存できません"
            )

        query = query.eq(
            "comparison_summary_id",
            comparison_summary_id
        )

    existing = query.execute()

    # 既に存在する場合
    if existing.data:
        return existing.data

    # 存在しない場合insert
    response = supabase.table(
        "favorites"
    ).insert(
        data
    ).execute()

    return response.data

# ネタ帳削除
def delete_favorite(favorite_id: int,user_id: str):

    response = supabase.table(
        "favorites"
    ).delete().eq(
        "id", favorite_id
    ).eq("user_id", user_id
    ).execute()
    
    return response.data

# フロント表示用ネタ帳リスト（JOIN）
def get_favorites_with_summaries(user_id: str):

    response = supabase.table(
        "favorites"
    ).select(
        """
        id,
        created_at,
        country_summary_id,
        comparison_summary_id,

        country_summaries(
            id,

            medias(
                country_name
            ),

            topics(
                topic_name
            )
        ),

        comparison_summaries(
            id,

            topics(
                topic_name
            )
        )
        """
    ).eq(
        "user_id",
        user_id
    ).order(
        "created_at",
        desc=True
    ).execute()

    result = []

    for row in response.data:

        # 各国要約の場合
        if row["country_summary_id"] and row["country_summaries"]:

            country_summary = row["country_summaries"]

            result.append({

                "favorite_id":
                    row["id"],

                "created_at":
                    row["created_at"][:10],

                "type":
                    "country",

                "topic_name":
                    country_summary
                    ["topics"]
                    ["topic_name"],

                "label":
                    country_summary
                    ["medias"]
                    ["country_name"]
                    + "詳細",

                "target_id":
                    row["country_summary_id"]

            })

        # 比較要約の場合
        elif row["comparison_summary_id"] and row["comparison_summaries"]:

            comparison_summary = row["comparison_summaries"]

            result.append({

                "favorite_id":
                    row["id"],

                "created_at":
                    row["created_at"][:10],

                "type":
                    "comparison",

                "topic_name":
                    comparison_summary
                    ["topics"]
                    ["topic_name"],

                "label":
                    "比較要約",

                "target_id":
                    row["comparison_summary_id"]

            })


    return result

# お気に入りID一覧取得（home用）
def get_user_favorite_ids(user_id: int):

    response = supabase.table(
        "favorites"
    ).select(
        "country_summary_id"
    ).eq(
        "user_id",
        user_id
    ).execute()

    if not response.data:
        return set()

    return {
        row["country_summary_id"]
        for row in response.data
        if row["country_summary_id"]
    }