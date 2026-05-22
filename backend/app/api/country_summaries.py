from fastapi import APIRouter, HTTPException, Depends

from app.db.supabase import supabase

from app.core.auth import (get_current_user_optional,get_current_user) 

from app.services.country_service import (
    get_country_summaries,
    get_country_summary_by_id,
    get_country_detail,
    get_home_country_summaries
)

router = APIRouter()

# ホーム一覧
@router.get("/home")
def read_home_country_summaries(
    user=Depends(get_current_user_optional)
):
    is_login = user is not None

    data = get_home_country_summaries(
        is_login=is_login,
        auth_user_id=user["sub"] if user else None
    )

    return {
        "is_login": is_login,
        "data": data
    }

# 一覧取得
@router.get("")
def read_country_summaries():

    return get_country_summaries()

# 1件取得
@router.get("/{id}")
def read_country_summary(id: int):

    data = get_country_summary_by_id(id)

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Country summary not found"
        )

    return data

# 詳細取得(ログイン必須)
@router.get("/{id}/detail")
def read_country_detail(
    id: int,
    user=Depends(get_current_user_optional),
    ):

    public_user_id = None

    if user:
        auth_user_id = user["sub"]

        user_res = (
            supabase
            .table("users")
            .select("id")
            .eq("auth_user_id", auth_user_id)
            .maybe_single()
            .execute()
        )

        if user_res and user_res.data:
            public_user_id = user_res.data["id"]

    result = get_country_detail(id,public_user_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Country summary not found"
        )

    return result