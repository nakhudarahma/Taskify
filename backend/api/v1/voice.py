from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from api.dependencies import get_current_user
from services.voice_service import VoiceService
from ai.llm_client import AIService
from database.postgres import get_db

router = APIRouter()

@router.post("/process")
def process_voice_command(
    text: str = Body(..., embed=True), 
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Frontend sends STT result (text).
    Backend processes intent and executes logic.
    """
    ai_service = AIService()
    service = VoiceService(db, current_user, ai_service)
    print(f"🎤 Debug: Processing voice command: {text}")
    return service.handle_voice_command(text)

@router.post("/parse")
def parse_voice_command(
    text: str = Body(..., embed=True),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ai_service = AIService()
    service = VoiceService(db, current_user, ai_service)
    return service.parse_command(text)