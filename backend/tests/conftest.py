import os

import pytest
from fastapi.testclient import TestClient

# Keep backend imports from failing in tests.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

from app.core.auth import get_current_user, get_current_user_optional
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def override_auth_user():
    app.dependency_overrides[get_current_user] = lambda: {"id": "auth-1"}
    return {"id": "auth-1"}


@pytest.fixture
def override_optional_user():
    app.dependency_overrides[get_current_user_optional] = lambda: {"sub": "auth-1"}
    return {"sub": "auth-1"}
