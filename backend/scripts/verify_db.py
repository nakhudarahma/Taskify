from database.postgres import SessionLocal
from sqlalchemy import text

try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))
    print("✅ Database connection successful!")
    
    # Check users
    result = db.execute(text("SELECT count(*) FROM users"))
    user_count = result.scalar()
    print(f"👥 Users count: {user_count}")

    # Check tasks
    result = db.execute(text("SELECT id, title, due_date, status, user_id FROM tasks"))
    tasks = result.fetchall()
    print(f"✅ Tasks count: {len(tasks)}")
    for task in tasks:
        print(f"  - ID: {task.id}, Name: {task.title}, Due: {task.due_date}, Status: {task.status}, UserID: {task.user_id}")


except Exception as e:
    print(f"❌ Database connection failed: {e}")
finally:
    db.close()
