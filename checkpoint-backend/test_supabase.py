import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

print(f"Testing connection to {url}")
try:
    supabase = create_client(url, key)
    res = supabase.table("students").select("count", count="exact").execute()
    print(f"Success! Found {res.count} students.")
except Exception as e:
    print(f"Failed: {e}")
