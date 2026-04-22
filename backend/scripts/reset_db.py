from database.postgres import engine, Base
from models.user import User
from models.task import Task
# Import other models if needed to ensure they are registered in Base

def reset_db():
    print("WARNING: Dropping all tables...")
    try:
        Base.metadata.drop_all(bind=engine)
        print("✅ Tables dropped successfully!")
        
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
    except Exception as e:
        print(f"❌ Error resetting database: {e}")

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete all data? (y/n): ")
    if confirm.lower() == 'y':
        reset_db()
    else:
        print("Cancelled.")
