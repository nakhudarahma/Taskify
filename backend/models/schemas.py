from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

# --- Auth Models ---
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    
    model_config = ConfigDict(from_attributes=True)

# --- Task Models ---
# --- Task Models ---
class TaskCreate(BaseModel):
    title: str = Field(..., description="Mandatory task title")
    due_date: str = Field(..., description="Mandatory due date YYYY-MM-DD")
    due_time: Optional[str] = None
    reminder_time: Optional[int] = None
    duration_minutes: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    reminder_time: Optional[int] = None
    status: Optional[str] = None # pending / completed

class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    due_date: str
    due_time: Optional[str] = None
    reminder_time: Optional[int] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Analytics Models ---
class AnalyticsSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float

class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed: int
    pending: int
    due_today: int
    ai_insight: str

class VoiceSettings(BaseModel):
    voice_type: str = "alloy"
    pitch: float = 1.0
    rate: float = 1.0

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    voice_settings: Optional[VoiceSettings] = None

