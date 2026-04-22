from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.dependencies import get_current_user
from services.analytics_service import AnalyticsService
from models.schemas import AnalyticsResponse
from database.postgres import get_db

router = APIRouter()

@router.get("/summary", response_model=AnalyticsResponse)
def get_analytics(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = AnalyticsService(db, current_user.id)
    metrics = service.get_summary()
    insight = service.generate_insight(metrics, current_user.name)
    
    return {
        "total_tasks": metrics['total'],
        "completed": metrics['completed'],
        "pending": metrics['pending'],
        "due_today": metrics['due_today'],
        "ai_insight": insight
    }