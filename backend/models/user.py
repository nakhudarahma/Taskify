from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database.postgres import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    voice_settings = Column(JSON, default={"voice_type": "default", "voice_speed": 1.0, "voice_feedback_enabled": True})
