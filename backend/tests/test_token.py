import sys
import os
from jose import jwt
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.getcwd())

from core.config import settings
from core.security import create_access_token, decode_access_token

def test_token_logic():
    print(f"--- 🔐 Testing Token Logic ---")
    print(f"Secret Key: {settings.SECRET_KEY}")
    print(f"Algorithm: {settings.ALGORITHM}")

    # 1. Create a valid token
    user_id = "test_user_123"
    token = create_access_token(user_id)
    print(f"\nGenerated Token: {token}")

    # 2. Decode it immediately
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"✅ Immediate Decode Success: {decoded}")
    except Exception as e:
        print(f"❌ Immediate Decode Failed: {e}")

    # 3. Test the actual function
    result = decode_access_token(token)
    if result:
        print(f"✅ decode_access_token() Success: {result}")
    else:
        print(f"❌ decode_access_token() returned None")

if __name__ == "__main__":
    test_token_logic()
