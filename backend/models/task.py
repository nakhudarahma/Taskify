from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.postgres import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    due_date = Column(String, nullable=False) # Keep as string for now to match strict rules "date"
    due_time = Column(String, nullable=True)
    reminder_time = Column(Integer, nullable=True) # Storing as minutes or similar
    status = Column(String, default="pending") # pending / completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("models.user.User", backref="tasks") 
