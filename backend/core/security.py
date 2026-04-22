from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], user_name: str = None) -> str:
    # Use timezone-aware UTC for creation
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    if user_name:
        to_encode["name"] = user_name
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        # Step 1: Decode without automatic expiration check
        decoded_token = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}
        )
        
        # Step 2: Manual Expiration Check with 5-minute leeway
        exp = decoded_token.get("exp")
        if exp:
            current_time = datetime.now(timezone.utc).timestamp()
            # exp is usually an int timestamp
            if current_time > (exp + 300):
                print(f"❌ JWT Decode Error: Token has expired (Current: {int(current_time)}, Exp: {exp})")
                return None
            else:
                # DEBUG: confirm success
                print(f"✅ JWT Decode Success: sub={decoded_token.get('sub')} exp={exp} current={int(current_time)}")
                
        return decoded_token
    except jwt.JWTError as e:
        print(f"❌ JWT Decode Error (JWTError): {str(e)}")
        return None
    except Exception as e:
        print(f"❌ JWT Decode Error (General): {str(e)}")
        return None