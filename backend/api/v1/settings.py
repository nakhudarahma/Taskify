from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.dependencies import get_current_user
from database.postgres import get_db
from models.schemas import VoiceSettings, ProfileUpdate
from models.user import User

router = APIRouter()

@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email,
        "voice_settings": current_user.voice_settings or {}
    }

@router.put("/profile")
def update_profile(profile: ProfileUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    
    updates = profile.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key == "voice_settings" and value:
             user.voice_settings = value.model_dump()
        elif hasattr(user, key) and value is not None:
             setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
        
    return {"status": "updated", "message": "Profile updated successfully"}

@router.put("/voice")
def update_voice_settings(settings: VoiceSettings, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    
    user.voice_settings = settings.model_dump()
    db.commit()
    
    return {
        "status": "updated", 
        "message": f"Voice changed to {settings.voice_type}"
    }