import firebase_admin
from firebase_admin import credentials, firestore
import os

# Force the usage of the credentials file in the current directory, same as verify_firestore.py
cred_path = os.path.join(os.getcwd(), "firebase_credentials.json")

if not os.path.exists(cred_path):
    print(f"❌ File not found: {cred_path}")
    exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    users_ref = db.collection("users")
    docs = users_ref.stream()
    
    print("Listing users in Firestore:")
    count = 0
    for doc in docs:
        user_data = doc.to_dict()
        print(f"User ID: {doc.id}, Name: {user_data.get('name')}, Email: {user_data.get('email')}")
        count += 1
        
    if count == 0:
        print("No users found.")
        
except Exception as e:
    print(f"Error: {e}")
