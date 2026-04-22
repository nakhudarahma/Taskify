from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from core.security import get_password_hash, verify_password, create_access_token
from models.user import User
from models.schemas import UserSignup, UserLogin

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def signup(self, user_data: UserSignup):
        # Check if email exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create User
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=get_password_hash(user_data.password)
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        
        # Create access token
        token = create_access_token(new_user.id, new_user.name)
        return {"access_token": token, "token_type": "bearer", "user_name": new_user.name}

    def login(self, login_data: UserLogin):
        # Find user by email
        user = self.db.query(User).filter(User.email == login_data.email).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect email or password")

        token = create_access_token(user.id, user.name)
        return {"access_token": token, "token_type": "bearer", "user_name": user.name}