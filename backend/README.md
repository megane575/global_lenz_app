# Global Lenz - Backend

世界5カ国のニュースをAIが自動収集・要約・比較分析するAPIサーバーです。

---

## 1. 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | FastAPI |
| 言語 | Python 3.11 |
| データベース | Supabase (PostgreSQL) |
| キャッシュ | Redis |
| AI | OpenAI GPT-4o-mini |
| 認証 | Supabase Auth (JWT / ES256) |
| コンテナ | Docker / Docker Compose |
| Automation | GitHub Actions |

---

## 2. 実行スケジュールと自動化
バッチ処理は GitHub Actions を利用し、毎日決まった時間に実行されます。

定期バッチ実行
- スケジュール: 毎日 03:00 JST (18:00 UTC)
- トリガー: GitHub Actions (Cron)
- 内容: 全メディアからの記事収集、AI要約の生成、DB保存。
- セキュリティ: APIキーやDB接続情報は GitHub Secrets で厳重に管理。

## 3. ディレクトリ構成

```
backend/
├── app/
│   ├── api/                  # エンドポイント定義
│   │   ├── country_summaries.py
│   │   ├── comparison_summaries.py
│   │   ├── favorites.py
│   │   ├── topics.py
│   │   └── search.py
│   ├── logic/                # ビジネスロジック
│   │   ├── ai_service.py     # AI処理（トピック抽出・要約生成）
│   │   ├── news_service.py   # ニュース収集（RSS取得）
│   │   └── search_service.py # 検索処理
│   ├── db/
│   │   └── repository.py     # DB操作（Supabase）
│   │   └── supabase.py       # DBクライアント設定
│   ├── cache/
│   │   └── redis_client.py   # Redisキャッシュ
│   ├── core/
│   │   └── auth.py           # JWT認証
│   ├── schemas/              
│   │   ├── favorite.py       # Pydanticモデル（バリデーション）
│   ├── services/             # 共通サービス層
│   │   └── comparison_service.py    
│   │   └── country_service.py        
│   │   └── favorite_service.py       
│   │   └── user_service.py           
│   ├── config.py             # メディア設定
│   ├── app_api.py            # ルーター統合
│   ├── batch_worker.py       # バッチ処理
│   └── main.py               # FastAPIエントリーポイント
├── batch_worker.py           # バッチ処理（手動実行）
├── requirements.txt
└── Dockerfile
```

---

## 4. 主要API

| メソッド | エンドポイント | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/country-summaries/home` | ホーム用トピック一覧取得 | 任意 |
| GET | `/api/country-summaries/{id}/detail` | 各国要約の詳細取得 | 必須 |
| GET | `/api/topics/today` | 当日トピック一覧取得 | 不要 |
| GET | `/api/comparison-summaries/{id}` | 5カ国比較要約取得 | 必須 |
| POST | `/api/search` | キーワード検索・要約生成 | 不要 |
| POST | `/api/favorites/` | ネタ帳に保存 | 必須 |
| DELETE | `/api/favorites/{id}` | ネタ帳から削除 | 必須 |

---

## 5. バッチ処理

GitHub Actionsにより、毎日 03:00 (JST) に完全自動実行。

```bash
docker compose exec backend python -m app.batch_worker
```

### バッチの処理フロー

```
1. 各メディアのRSSから見出し収集（各15件）
        ↓
2. AIがトレンドトピックを6つ抽出
        ↓
3. 重複チェック・品質チェック・補充
        ↓
4. 各トピックについて5カ国分の記事を取得
        ↓
5. AIが各国要約・比較分析・スコアを生成
        ↓
6. Supabaseに保存
```

---

## 6. ニュースソース

| メディア | 国 | RSS |
|---|---|---|
| BBC News | イギリス | BBC公式 世界ニュースRSS |
| Al Jazeera | カタール | Al Jazeera公式RSS |
| CNN | アメリカ | Google News（英語）|
| NHK NEWS WEB | 日本 | NHK公式 国際ニュースRSS |
| DD News | インド | Google News（インド向け）|

---

## 7. キャッシュ設計

| 対象 | TTL | 説明 |
|---|---|---|
| Google News検索結果 | 2時間 | 同一クエリの重複リクエスト防止 |
| URLデコード結果 | 24時間 | Google NewsリダイレクトURLの変換結果 |
| ユーザー検索結果 | 6時間 | 同一キーワードの再検索を高速化 |

---

## 8. 環境変数

`.env` ファイルをbackendディレクトリに作成してください。

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-api-key
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 9. ローカル起動

```bash
# コンテナ起動
docker compose up

# バッチ手動実行
docker compose exec backend python -m app.batch_worker

# ログ確認
docker compose logs backend -f
```

---

## 10. AIの工夫点

### トピック抽出の品質チェック（多層化）
AIの出力をそのまま使わず、以下の3種類を自動チェックしています。
- query_enの国名とトピック名の乖離
- 事象語なしトピック（主体のみ）の検出
- 州・地方レベル選挙の除外

### 常に6トピックを保証
重複除去で6件未満になった場合、不足分を自動補充します。

### 2段階フォールバック検索
メディア指定検索でヒットしない場合、フィルターなしの上位5件からドメイン一致＋関連性チェックで記事を探します。

### 関連性チェックによる誤記事の除外
取得した記事がトピックと関連しているかをAIで判定し、無関係な記事を自動除外します。

### NHK専用クエリ
英語メディアには英語クエリ、NHKには日本語クエリを別途生成します。
