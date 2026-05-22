from app.db.supabase import supabase


def get_public_user_id(auth_user_id: str) -> str:
    response = supabase.table("users") \
        .select("id") \
        .eq("auth_user_id", auth_user_id) \
        .single() \
        .execute()

    if not response.data:
        raise Exception("public user not found")

    return response.data["id"]