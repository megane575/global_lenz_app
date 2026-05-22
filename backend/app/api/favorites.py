from typing import Optional

from fastapi import APIRouter, Query, Depends

from app.core.auth import get_current_user

from app.db.supabase import supabase
from app.services.user_service import get_public_user_id

from app.services.favorite_service import (
    get_favorites,
    create_favorite,
    delete_favorite,
    get_favorites_with_summaries
)

from app.schemas.favorite import FavoriteCreate

router = APIRouter()

# ネタ帳一覧取得
@router.get("/")
def read_favorites(user=Depends(get_current_user)):
    auth_id = user["id"]

    public_user_id = get_public_user_id(auth_id)

    return get_favorites(public_user_id)

#　ネタ帳に登録
@router.post("/")
def add_favorite(
    favorite: FavoriteCreate,
    user=Depends(get_current_user)
):

    auth_id = user["id"]

    public_user_id = get_public_user_id(auth_id)

    favorite_data= favorite.model_dump()

    favorite_data["user_id"] = public_user_id

    return create_favorite(favorite_data)

#  ネタ帳から削除
@router.delete("/")
def remove_favorite(
    country_summary_id: Optional[int] = Query(default=None),
    comparison_summary_id: Optional[int] = Query(default=None),
    user=Depends(get_current_user)
):

    auth_user_id = user["id"]

    user_res = (
        supabase.table("users")
        .select("id")
        .eq("auth_user_id", auth_user_id)
        .maybe_single()
        .execute()
    )

    public_user_id = user_res.data["id"]

    # ベースクエリ
    query = (
        supabase.table("favorites")
        .delete()
        .eq("user_id", public_user_id)
    )

    # country削除
    if country_summary_id is not None:
        query = query.eq("country_summary_id", country_summary_id)

    # comparison削除
    if comparison_summary_id is not None:
        query = query.eq("comparison_summary_id", comparison_summary_id)

    response = query.execute()

    return response.data

# フロント表示用ネタ帳リスト
@router.get("/with-summaries")
def read_favorites_with_summaries(
    user=Depends(get_current_user)
):
    auth_id = user["id"]

    public_user_id = get_public_user_id(auth_id)

    return get_favorites_with_summaries(
        public_user_id
    )