from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from app.app_api import router as api_router
from app.core.auth import get_current_user,get_current_user_optional

app = FastAPI()

# --- CORS設定の追加_フロントエンドからのアクセスを許可します
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "Backendが動きました!!"}

# 認証テストAPI
@app.get("/api/me")
async def get_me(user=Depends(get_current_user)):
    return user

# テスト用API
@app.get("/test-optional")
def test_optional(
    user=Depends(get_current_user_optional)
):
    return {
        "user": user
    }
