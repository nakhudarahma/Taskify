import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_signup():
    print("Testing Backend Connectivity...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {r.status_code} {r.text}")
    except Exception as e:
        print(f"Could not connect to backend: {e}")
        return

    print("\nTesting Signup...")
    payload = {
        "email": "test_user_new_1@example.com",
        "password": "password123",
        "name": "Test User"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/auth/signup", json=payload)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_signup()
