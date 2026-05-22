from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.logic.search_service import run_search

router = APIRouter()


class SearchRequest(BaseModel):
    keyword: str


@router.post("")
def search(req: SearchRequest):
    """
    ユーザーが入力したキーワードで各国記事を取得し要約を生成して返す。
    同じキーワードは6時間Redisにキャッシュされる。

    リクエスト例:
        POST /api/search
        {"keyword": "イラン核合意"}

    レスポンス例:
        {
            "topic_name": "イラン核合意",
            "query_en": "Iran Nuclear",
            "query_nhk": "イラン 核",
            "report": {
                "country_summaries": [...],
                "comparison_summary": {...}
            },
            "media_results": {...}
        }
    """
    keyword = req.keyword.strip()

    if not keyword:
        raise HTTPException(status_code=400, detail="キーワードを入力してください")

    if len(keyword) > 100:
        raise HTTPException(status_code=400, detail="キーワードは100文字以内で入力してください")

    try:
        result = run_search(keyword)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"検索エラー: {str(e)}")
