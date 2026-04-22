import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_task_creation():
    # 1. Signup/Login to get token
    auth_url = f"{BASE_URL}/auth/signup"
    headers = {"Content-Type": "application/json"}
    # Use a random email to avoid collision if possible, or just login
    import random
    rand_int = random.randint(1, 10000)
    user_payload = {
        "email": f"tasktest_{rand_int}@example.com",
        "password": "password123",
        "name": f"Task Tester {rand_int}"
    }
    
    print(f"1. Attempting Signup with {user_payload['email']}...")
    try:
        response = requests.post(auth_url, json=user_payload, headers=headers)
        if response.status_code != 200:
            print(f"Signup failed: {response.text}")
            # Try login if signup fails (e.g. email exists)
            print("Trying login instead...")
            login_url = f"{BASE_URL}/auth/signin"
            login_payload = {
                "email": user_payload["email"],
                "password": user_payload["password"]
            }
            response = requests.post(login_url, json=login_payload, headers=headers)
            if response.status_code != 200:
                print(f"Login failed: {response.text}")
                return False
        
        data = response.json()
        token = data.get("access_token")
        if not token:
            print("No access token returned!")
            return False
        print(f"Signup/Login successful. Token: {token[:10]}...")
        
        # 2. Create Task
        task_url = f"{BASE_URL}/tasks/create"
        auth_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        # Note: Using 'title' as per schema, not 'task_name'
        task_payload = {
            "title": "Test Task from Script",
            "due_date": "2023-12-31",
            "due_time": "12:00",
            "reminder_time": 15,
            "duration_minutes": 60
        }
        
        print(f"\n2. Creating Task with payload: {task_payload}")
        task_response = requests.post(task_url, json=task_payload, headers=auth_headers)
        
        print(f"Status Code: {task_response.status_code}")
        print(f"Response: {task_response.text}")
        
        if task_response.status_code == 200:
            print("Task Creation SUCCESS!")
            return True
        elif task_response.status_code == 422:
             print("Validation Error - Check Field Names!")
             return False
        elif task_response.status_code == 401:
             print("Unauthorized - Token rejected!")
             return False
        else:
             print("Task Creation FAILED!")
             return False

    except Exception as e:
        print(f"Exception: {e}")
        return False

if __name__ == "__main__":
    test_task_creation()
