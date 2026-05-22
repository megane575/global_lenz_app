import os
from supabase import create_client
from dotenv import load_dotenv

# .env の明示読み込み
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_KEY exists:", SUPABASE_KEY is not None)

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY is not set")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)