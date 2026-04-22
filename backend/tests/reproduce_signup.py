import requests
import json

BASE_URL = "http://localhost:8000/api/v1"


def test_signup():
    url = f"{BASE_URL}/auth/signup"
    headers = {"Content-Type": "application/json"}
    payload = {
        "email": "testuser_repro@example.com",
        "password": "password123",
        "name": "Test User Repro"
    }
    
    print(f"Testing Signup at {url} with payload: {payload}")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("Signup Successful!")
            return True
        else:
            print("Signup Failed!")
            return False
            
    except Exception as e:
        print(f"Exception during request: {e}")
        return False

if __name__ == "__main__":
    test_signup()
