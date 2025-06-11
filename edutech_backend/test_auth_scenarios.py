#!/usr/bin/env python3
"""
Test script to demonstrate different authentication scenarios
Run this script to test the refactored authentication flow
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test.auth@example.com"
TEST_USER_PASSWORD = "TestPassword123"
TEST_USER_NAME = "Test Auth User"

class AuthTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=base_url)
        
    async def close(self):
        await self.client.aclose()
    
    async def print_response(self, description: str, response: httpx.Response):
        """Print formatted response for testing"""
        print(f"\n{'='*60}")
        print(f"🧪 {description}")
        print(f"{'='*60}")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            content = response.json()
            print(f"Body: {json.dumps(content, indent=2)}")
        except:
            print(f"Body: {response.text}")
        print("="*60)
    
    async def create_test_user(self) -> Dict[str, Any]:
        """Create a test user for authentication testing"""
        user_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": TEST_USER_NAME
        }
        
        response = await self.client.post("/auth/register", json=user_data)
        await self.print_response("Creating Test User", response)
        
        if response.status_code == 201 or response.status_code == 200:
            return response.json()
        elif response.status_code == 400 and "already registered" in response.text:
            # User already exists, try to login
            login_response = await self.client.post("/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            return login_response.json() if login_response.status_code == 200 else None
        else:
            return None
    
    async def test_scenario_1_valid_active_user(self, token: str):
        """Test: Valid token + active user → 200 OK"""
        headers = {"Authorization": f"Bearer {token}"}
        response = await self.client.get("/auth/me", headers=headers)
        await self.print_response("✅ Test 1: Valid token + Active user", response)
        
        expected = 200
        actual = response.status_code
        print(f"Expected: {expected}, Got: {actual} - {'✅ PASS' if actual == expected else '❌ FAIL'}")
    
    async def test_scenario_2_invalid_token(self):
        """Test: Invalid/tampered token → 401 Unauthorized"""
        invalid_token = "invalid.jwt.token.here"
        headers = {"Authorization": f"Bearer {invalid_token}"}
        response = await self.client.get("/auth/me", headers=headers)
        await self.print_response("❌ Test 2: Invalid/tampered token", response)
        
        expected = 401
        actual = response.status_code
        print(f"Expected: {expected}, Got: {actual} - {'✅ PASS' if actual == expected else '❌ FAIL'}")
    
    async def test_scenario_3_expired_token(self):
        """Test: Expired token → 401 Unauthorized"""
        # This is a pre-generated expired JWT token (expired in 2020)
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNTc3ODM2ODAwfQ.invalid_signature"
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await self.client.get("/auth/me", headers=headers)
        await self.print_response("⏰ Test 3: Expired token", response)
        
        expected = 401
        actual = response.status_code
        print(f"Expected: {expected}, Got: {actual} - {'✅ PASS' if actual == expected else '❌ FAIL'}")
    
    async def test_scenario_4_no_token(self):
        """Test: No token provided → 401/403 (depends on FastAPI security)"""
        response = await self.client.get("/auth/me")
        await self.print_response("🚫 Test 4: No token provided", response)
        
        # FastAPI HTTPBearer should return 403 for missing token
        expected = 403
        actual = response.status_code
        print(f"Expected: {expected}, Got: {actual} - {'✅ PASS' if actual == expected else '❌ FAIL'}")
    
    async def test_scenario_5_token_missing_sub(self):
        """Test: Token missing 'sub' field → 401 Unauthorized"""
        # Create a JWT token without 'sub' field (using the same secret as the app)
        import jwt
        from datetime import datetime, timedelta
        
        # You'll need to use the same secret as your app
        secret = "tx4`lA/cev3NK},tl5fM`&2FR}qj@81KQi6QSSO0Vx`@kJbZf!2d9}iOvC(EmEz:"
        payload = {
            "exp": datetime.utcnow() + timedelta(minutes=30),
            # Missing 'sub' field intentionally
            "iat": datetime.utcnow()
        }
        token_without_sub = jwt.encode(payload, secret, algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {token_without_sub}"}
        response = await self.client.get("/auth/me", headers=headers)
        await self.print_response("🔍 Test 5: Token missing 'sub' field", response)
        
        expected = 401
        actual = response.status_code
        print(f"Expected: {expected}, Got: {actual} - {'✅ PASS' if actual == expected else '❌ FAIL'}")
    
    async def simulate_inactive_user_test(self, user_id: str):
        """
        Test: Valid token but inactive user → 403 Forbidden
        Note: This would require direct database access to set is_active=False
        """
        print(f"\n{'='*60}")
        print("🚪 Test 6: Valid token + Inactive user")
        print("="*60)
        print("⚠️  To test this scenario, you would need to:")
        print("1. Connect to your database")
        print(f"2. UPDATE users SET is_active = FALSE WHERE id = {user_id}")
        print("3. Then call /auth/me with the user's valid token")
        print("4. Expected result: 403 Forbidden")
        print("5. Don't forget to set is_active = TRUE afterwards")
        print("="*60)
    
    async def run_all_tests(self):
        """Run all authentication test scenarios"""
        print("🚀 Starting Authentication Flow Tests")
        print("="*60)
        
        # Step 1: Create test user and get token
        user_data = await self.create_test_user()
        if not user_data or not user_data.get("success"):
            print("❌ Failed to create/login test user. Cannot continue tests.")
            return
        
        token = user_data["tokens"]["accessToken"]
        user_id = user_data["user"]["id"]
        
        # Run all test scenarios
        await self.test_scenario_1_valid_active_user(token)
        await self.test_scenario_2_invalid_token()
        await self.test_scenario_3_expired_token()
        await self.test_scenario_4_no_token()
        await self.test_scenario_5_token_missing_sub()
        await self.simulate_inactive_user_test(user_id)
        
        print(f"\n🎯 All tests completed!")
        print("="*60)

async def main():
    """Main function to run authentication tests"""
    tester = AuthTester()
    
    try:
        await tester.run_all_tests()
    except Exception as e:
        print(f"❌ Error running tests: {e}")
    finally:
        await tester.close()

if __name__ == "__main__":
    print("🧪 Authentication Flow Test Suite")
    print("Make sure your FastAPI server is running on http://localhost:8000")
    print("Press Ctrl+C to cancel...")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Tests cancelled by user") 