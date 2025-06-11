"""
Quick test script to verify chat endpoints are working
Run this after starting the backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_health_endpoint():
    """Test the chat health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/chat/health")
        print(f"Health check status: {response.status_code}")
        print(f"Health response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    try:
        # Test login endpoint exists
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        print(f"Auth endpoint status: {response.status_code}")
        # 401 is expected for wrong credentials, which means endpoint exists
        return response.status_code in [401, 422]  # 422 for validation errors
    except Exception as e:
        print(f"Auth test failed: {e}")
        return False

def main():
    print("=== EduTech AI Assistant Endpoint Tests ===\n")
    
    print("1. Testing health endpoint...")
    health_ok = test_health_endpoint()
    
    print("\n2. Testing auth endpoints...")
    auth_ok = test_auth_endpoints()
    
    print(f"\n=== Results ===")
    print(f"Health endpoint: {'✅' if health_ok else '❌'}")
    print(f"Auth endpoint: {'✅' if auth_ok else '❌'}")
    
    if health_ok and auth_ok:
        print("\n🎉 Backend is running and endpoints are accessible!")
        print("You can now navigate to the AI Assistant in your frontend.")
    else:
        print("\n❌ Some endpoints are not working. Check your backend server.")

if __name__ == "__main__":
    main() 