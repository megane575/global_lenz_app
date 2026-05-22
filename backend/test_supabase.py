# これはFastAPIとsupabaseの接続のためのテストファイルです

from app.db.supabase import supabase

def test_connection():

    response = supabase.table(
        "topics"
    ).select("*").execute()

    print("取得データ:")
    print(response.data)

test_connection()