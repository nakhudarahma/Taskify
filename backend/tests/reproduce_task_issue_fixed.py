import requests
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def debug_task_creation():
    # 1. Signup/Signin
    email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    name = f"Test User {uuid.uuid4()}"
    
    print(f"Creating user: {email}")
    auth_payload = {
        "email": email,
        "password": password,
        "name": name
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=auth_payload, timeout=5)
    except Exception as e:
        print(f"Signup exception: {e}")
        return

    if response.status_code != 200:
        print(f"Signup failed: {response.text}")
        return

    token_data = response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        print("No access token returned")
        print(token_data)
        return
        
    print(f"Got token: {access_token[:10]}...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Create Task using TITLE
    task_payload = {
        "title": "Test Task Fixed",
        "due_date": "2023-12-31",
        "due_time": "12:00",
        "reminder_time": 15
    }
    
    print("Creating task...")
    try:
        response = requests.post(f"{BASE_URL}/tasks/create", json=task_payload, headers=headers, timeout=5)
    except Exception as e:
        print(f"Create task exception: {e}")
        return

    print(f"Create Task Status: {response.status_code}")
    print(f"Create Task Response: {response.text}")
    
    if response.status_code == 201 or response.status_code == 200:
        task_data = response.json()
        task_id = task_data.get("id")
        # Ensure title is returned
        title = task_data.get("title")
        print(f"Task created with ID: {task_id}, Title: {title}")
        
        # 3. Verify
        print("Fetching tasks...")
        response = requests.get(f"{BASE_URL}/tasks/", headers=headers, timeout=5)
        tasks = response.json()
        print(f"Found {len(tasks)} tasks")
        found_task = next((t for t in tasks if t['id'] == task_id), None)
        
        if found_task:
            print("SUCCESS: Task found in list")
            print(f"Task details: {found_task}")
        else:
            print("FAILURE: Task NOT found in list")
            print(tasks)
    else:
        print("FAILURE: Could not create task")

if __name__ == "__main__":
    debug_task_creation()
