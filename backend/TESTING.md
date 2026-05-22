# Backend Testing Guide

## 1) Setup

```bash
cd /Users/macbook/Desktop/global_lenz
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

## 2) Unit/API tests (mock中心)

```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests -q
```

## 3) Integration tests (Supabase / Redis)

1. `backend/.env.test.example` を参考に `.env.test` を作る
2. 環境変数を読み込んで実行（`RUN_INTEGRATION_TESTS=1` が必須）

```bash
set -a && source backend/.env.test && set +a
export RUN_INTEGRATION_TESTS=1
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/integration -q
```

未設定キーがある場合は該当テストが `skip` されます。

## 4) Marker指定で分離実行

```bash
# integration 以外
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests -m "not integration" -q

# integration のみ
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests -m integration -q
```
