import os

import pytest
import redis


def _has_redis_env() -> bool:
    return os.getenv("RUN_INTEGRATION_TESTS") == "1" and bool(os.getenv("REDIS_URL"))


pytestmark = [pytest.mark.integration]


@pytest.mark.skipif(
    not _has_redis_env(),
    reason="RUN_INTEGRATION_TESTS=1 と REDIS_URL が必要",
)
def test_redis_ping_and_roundtrip():
    """
    本物 Redis へ接続し、最小の set/get を確認する。
    """
    client = redis.Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)

    key = "test:healthcheck:cursor"
    client.set(key, "ok", ex=30)
    val = client.get(key)
    assert val == "ok"
