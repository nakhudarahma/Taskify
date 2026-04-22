from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from services.auth_service import AuthService
from models.schemas import UserSignup, UserLogin, Token
from database.postgres import get_db

router = APIRouter()

@router.post("/signup", response_model=Token)
def signup(user: UserSignup, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.signup(user)

@router.post("/signin", response_model=Token)
def signin(user: UserLogin, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.login(user)

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}