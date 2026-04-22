from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

# --- Enums for Business Rules ---
class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class VoicePreset(str, Enum):
    FEMALE_CALM = "female_calm"
    MALE_ASSERTIVE = "male_assertive"
    ROBOTIC = "robotic"

# --- Value Objects ---
class VoicePreferences(BaseModel):
    """Internal representation of voice settings."""
    voice_type: VoicePreset = VoicePreset.FEMALE_CALM
    voice_speed: float = Field(default=1.0, ge=0.5, le=2.0) # Speed constraint: 0.5x to 2.0x
    notification_enabled: bool = True

# --- Core Entities ---

class User(BaseModel):
    """
    Represents the User entity as stored in Firestore.
    Uses 'alias' to map Python snake_case to Firestore camelCase.
    """
    user_id: str = Field(..., alias="userId")
    name: str
    email: EmailStr
    hashed_password: str
    voice_settings: VoicePreferences
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "userId": "u123",
                "name": "Rahma",
                "email": "rahma@example.com",
                "hashed_password": "...",
                "voice_settings": {
                    "voice_type": "female_calm",
                    "voice_speed": 1.0,
                    "notification_enabled": True
                }
            }
        }

class Task(BaseModel):
    """
    Represents the Task entity as stored in Firestore.
    """
    task_id: str = Field(..., alias="taskId")
    user_id: str = Field(..., alias="userId")
    task_name: str = Field(..., alias="taskName")
    
    # We store dates as ISO strings in Firestore for easier querying
    due_date: str = Field(..., alias="dueDate") 
    due_time: Optional[str] = Field(default=None, alias="dueTime")
    
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    created_at: str = Field(..., alias="createdAt") # ISO Format String

    class Config:
        populate_by_name = True