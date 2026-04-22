from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    print("Hashing password...")
    hash = pwd_context.hash("password123")
    print(f"Hash: {hash}")
    print("Verifying password...")
    valid = pwd_context.verify("password123", hash)
    print(f"Valid: {valid}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
