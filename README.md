# Global Lenz 🌍

## アプリ名

**Global Lenz（グローバルレンズ）**

---

# 概要

**Global Lenz** は、複数の国・メディアのニュースを比較し、
AIによって各国の視点の違いや傾向を可視化するニュース比較アプリです。

同じトピックに対して、
日本・アメリカ・イギリス・カタール・インドなどの主要メディアの記事を収集し、
各国ごとの要約および比較要約を生成します。

さらに以下の指標を用いて、
ニュースの多角的理解を支援します。

- **おすすめ度**
  記事内容の重要性や注目度をAIが数値化

- **主張のばらつき度**
  各国の記事の論調の違いをAIが分析して数値化

ユーザーは気になった要約を
**ネタ帳（お気に入り）として保存**し、
後から振り返ることができます。

本アプリは、
**異なる視点からニュースを理解する力を支援すること**
を目的として開発されています。

## 画面イメージ

### トップページ
![トップ画面](./docs/top.png)

### ネタ帳
![ネタ帳](./docs/notebook.png)

### 比較画面
![比較](./docs/comparison.png)

---

# 使用技術

## フロントエンド

- Next.js（App Router）
- TypeScript
- Tailwind CSS
- ESLint
- Prettier

---

## バックエンド

- FastAPI
- Python 3.11

---

## データベース / 認証

- Supabase（PostgreSQL）
- Supabase Auth

---

## 外部サービス

- OpenAI API（要約生成）
- RSS Feed（記事取得）

対象メディア：

- NHK（日本）
- CNN（アメリカ）
- BBC（イギリス）
- Al Jazeera（カタール）
- DD News（インド）

---

## インフラ / 開発環境

- Docker
- Docker Compose
- Redis（キャッシュ）
- GitHub（developブランチ運用）

---

# アプリの主な機能

- RSSから記事を取得
- 各国記事の要約生成
- 比較要約の生成
- おすすめ度の表示
- 主張のばらつき度の表示
- 重要用語の抽出と表示
- 記事引用元情報表示
- ネタ帳（お気に入り）保存
- ユーザー認証（Supabase）

---

# フロントエンド起動方法

## 初回のみ

```bash
cd frontend

npm install
```

---

## 開発サーバ起動

```bash
npm run dev
```

起動後：

```text
http://localhost:3000
```

でアクセスできます。

---

# バックエンド起動方法

## 初回のみ

```bash
cd backend

python -m venv venv

source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

---

## 開発サーバ起動

```bash
uvicorn app.main:app --reload
```

起動後：

```text
http://localhost:8000
```

API確認：

```text
http://localhost:8000/docs
```

（Swagger UI）

---

# Docker起動方法（推奨）

プロジェクトルートで：

```bash
docker compose up --build
```

起動後：

| サービス | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |
| Redis    | localhost:6379        |

---

# 環境変数設定

プロジェクトルートに：

```text
.env
```

を作成してください。中身は空のままでいいです。

バックエンドディレクトリの直下に：

```text
.env
```

を作成してください。

例：

```env
OPENAI_API_KEY=your_openai_key

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
SUPABASE_ANON_KEY=your_supabase_anon_key

REDIS_HOST=redis
REDIS_PORT=6379
```

---

# ディレクトリ構成

```text
Global-Lenz/
│
├── .github/
│   └── pull_request_template.md
│
├── docs/
│
├── frontend/                # Next.js（フロントエンド）
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── public/
│   ├── .prettierrc
│   ├── eslint.config.mjs
│   ├── package.json
│   ├── Dockerfile
│   ├── .env
│   └── README.md
│
├── backend/                 # FastAPI（バックエンド）
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   └── README.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Gitブランチ運用

本プロジェクトでは以下のブランチ戦略を採用しています。

```text
main        本番用
develop     開発統合用
feature/*   各機能開発用
```

例：

```text
feature/frontend-layout
feature/backend-api
feature/rss-fetch
feature/auth
```

---

# 今後の実装予定

- RSS記事取得バッチ処理
- AI要約生成API
- 比較要約ロジック
- Redisキャッシュ導入
- ユーザー認証連携
- 決済機能（Subscription）

---

# 開発メンバーへ

開発を開始する前に：

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-task-name
```

を実行してください。

---

# ライセンス

本プロジェクトは教育・研究目的で開発されています。
