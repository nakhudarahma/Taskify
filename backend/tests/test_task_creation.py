import os
import sys

# Ensure we can import from backend root
sys.path.append(os.getcwd())

from services.task_service import TaskService
import firebase_admin
from firebase_admin import credentials, firestore

# Setup Firestore (Code duplicated from firestore.py/verify script because we are running as script)
cred_path = os.path.join(os.getcwd(), "firebase_credentials.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    # Ensure db is initialized in firestore module if TaskService uses it directly
    from database import firestore as db_module
    db_module.db = firestore.client()

# Pick a user ID from the list we saw earlier or a dummy one
# We saw 'q2xPdQrrAt3taEg3ZNbK'
TEST_USER_ID = "q2xPdQrrAt3taEg3ZNbK" 

print(f"Testing TaskService for user: {TEST_USER_ID}")

try:
    service = TaskService(TEST_USER_ID)
    
    task_data = {
        "title": "Debug Task from Script",
        "description": "Created via test_task_creation.py",
        "due_date": "2024-12-31",
        "due_time": "12:00",
        "duration_minutes": 30,
        "reminder_minutes": 15
    }
    
    print(f"Creating task with data: {task_data}")
    new_task = service.create_task(task_data)
    print(f"✅ Task created successfully!")
    print(f"Task ID: {new_task.get('id')}")
    print(f"Data: {new_task}")
    
    # Clean up? Maybe keep it to see in UI if possible.
    
except Exception as e:
    print(f"❌ Error creating task: {e}")
    import traceback
    traceback.print_exc()
