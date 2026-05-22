import os

import pytest
from supabase import create_client


def _has_supabase_env() -> bool:
    enabled = os.getenv("RUN_INTEGRATION_TESTS") == "1"
    has_keys = bool(os.getenv("SUPABASE_URL")) and bool(os.getenv("SUPABASE_SERVICE_KEY"))
    return enabled and has_keys


pytestmark = [pytest.mark.integration]


@pytest.mark.skipif(
    not _has_supabase_env(),
    reason="RUN_INTEGRATION_TESTS=1 と SUPABASE_URL / SUPABASE_SERVICE_KEY が必要",
)
def test_supabase_basic_connectivity():
    """
    本物の Supabase へ接続できるかの最小疎通テスト。
    データを書き換えない安全な read-only クエリに限定。
    """
    client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )

    # 既存プロジェクトで必ず存在するテーブルを想定（users）。
    # 行がなくても execute 自体が成功すれば接続確認としてはOK。
    res = client.table("users").select("id").limit(1).execute()
    assert res is not None
