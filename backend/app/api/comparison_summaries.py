from fastapi import APIRouter, HTTPException, Depends

from app.db.supabase import supabase

from app.core.auth import get_current_user_optional

from app.services.comparison_service import (
    get_comparison_summaries,
    get_comparison_summary_by_id,
    get_comparison_detail
)

router = APIRouter()

# 一覧取得
@router.get("")
def read_comparison_summaries():

    return get_comparison_summaries()

# 1件取得
@router.get("/{id}")
def read_comparison_summary(id: int):

    data = get_comparison_summary_by_id(id)

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Country summary not found"
        )

    return data

# 詳細取得
@router.get("/{id}/detail")
def read_comparison_detail(id: int,user = Depends(get_current_user_optional)):

    public_user_id = None

    if user:
        auth_user_id = user["sub"]

        # public.users.id を取得
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

    result = get_comparison_detail(id,public_user_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Comparison not found"
        )

    return result