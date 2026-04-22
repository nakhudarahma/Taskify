import sys
import os
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings
from models.user import User
from models.task import Task
from services.voice_service import VoiceService
from ai.llm_client import AIService
import services.task_service
print(f"DEBUG: Loading task_service from {services.task_service.__file__}")

# Setup DB
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def verify_chat():
    print("🚀 Starting Chat AI Verification...")

    # 1. Get or Create User
    user = db.query(User).filter(User.email == "chat_test@example.com").first()
    if not user:
        user = User(email="chat_test@example.com", name="ChatTester", password_hash="hashed")
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Created test user: {user.email}")
    else:
        print(f"ℹ️ Used existing test user: {user.email}")

    # 2. Clear existing tasks for clean test
    db.query(Task).filter(Task.user_id == user.id).delete()
    db.commit()

    # 3. Create Dummy Completed Tasks
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    
    task_today = Task(
        user_id=user.id, 
        title="Submit Project Report", 
        due_date=today.date(), 
        status="completed", 
        completed_at=today
    )
    task_yesterday = Task(
        user_id=user.id, 
        title="Buy Groceries", 
        due_date=yesterday.date(), 
        status="completed", 
        completed_at=yesterday
    )
    
    db.add(task_today)
    db.add(task_yesterday)
    db.commit()
    print(f"✅ inserted 2 completed tasks: '{task_today.title}' (Today) and '{task_yesterday.title}' (Yesterday)")

    # 4. Initialize Service
    ai_service = AIService()
    service = VoiceService(db, user, ai_service)

    # 5. Test Query: "What did I do today?"
    query = "What tasks did I complete today?"
    print(f"\n🗣️ Query: '{query}'")
    
    result = service.handle_voice_command(query)
    
    print("\n🤖 AI Response:")
    print(result)

    if result.get("success") and "Submit Project Report" in result.get("voice_feedback", ""):
        print("\n✅ Verification PASSED: AI mentioned the task completed today.")
    else:
        print("\n❌ Verification FAILED: AI did not mention the task.")

    # Cleanup
    # db.delete(task_today)
    # db.delete(task_yesterday)
    # db.commit()

if __name__ == "__main__":
    verify_chat()
