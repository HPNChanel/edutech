#!/usr/bin/env python3
"""
Test script to verify the refactored authentication system.

Tests:
1. Valid token, user active → /auth/me returns 200
2. Invalid token or expired → returns 401 → frontend logs out
3. Token valid but user deleted → returns 401 → frontend logs out 
4. Token valid, user inactive → returns 403 → frontend logs out
5. No token provided → returns 401

Run with: python test_auth_refactor.py
"""

import asyncio
import json
import sys
from datetime import timedelta
from typing import Dict, Any

import httpx
from jose import jwt

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test_auth_user@example.com"
TEST_PASSWORD = "TestPassword123!"
TEST_NAME = "Test Auth User"

class AuthTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        await self.client.aclose()

    async def print_response(self, description: str, response: httpx.Response):
        """Print response details for debugging"""
        print(f"\n🧪 {description}")
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        if response.content:
            try:
                content = response.json()
                print(f"   Body: {json.dumps(content, indent=2)}")
            except:
                print(f"   Body: {response.text}")
        print("-" * 50)

    async def create_test_user(self) -> Dict[str, Any]:
        """Create and login test user"""
        print("🔧 Setting up test user...")
        
        # Register user
        register_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": TEST_NAME
        }
        
        response = await self.client.post(
            f"{self.base_url}/api/auth/register",
            json=register_data
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "user_id": data["user"]["id"],
                "access_token": data["tokens"]["accessToken"]
            }
        else:
            print(f"❌ Failed to create test user: {response.status_code} - {response.text}")
            raise Exception("Test user creation failed")

    async def test_scenario_1_valid_active_user(self, token: str):
        """✅ Valid token, user active → /auth/me returns 200"""
        print("\n📋 Test 1: Valid token + Active user")
        
        response = await self.client.get(
            f"{self.base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        await self.print_response("Valid Active User", response)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["success"] == True, "Response should indicate success"
        assert "user" in data, "Response should contain user data"
        print("✅ Test 1 PASSED")

    async def test_scenario_2_invalid_token(self):
        """❌ Invalid token → returns 401"""
        print("\n📋 Test 2: Invalid token")
        
        invalid_token = "invalid.jwt.token"
        response = await self.client.get(
            f"{self.base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        
        await self.print_response("Invalid Token", response)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Test 2 PASSED")

    async def test_scenario_3_expired_token(self):
        """❌ Expired token → returns 401"""
        print("\n📋 Test 3: Expired token")
        
        # Create an expired token
        from app.config import settings
        expired_payload = {
            "sub": TEST_EMAIL,
            "exp": 1234567890  # Very old timestamp
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        response = await self.client.get(
            f"{self.base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        
        await self.print_response("Expired Token", response)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Test 3 PASSED")

    async def test_scenario_4_no_token(self):
        """❌ No token provided → returns 401"""
        print("\n📋 Test 4: No token provided")
        
        response = await self.client.get(f"{self.base_url}/api/auth/me")
        
        await self.print_response("No Token", response)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Test 4 PASSED")

    async def test_scenario_5_token_missing_sub(self):
        """❌ Token missing sub field → returns 401"""
        print("\n📋 Test 5: Token missing 'sub' field")
        
        from app.config import settings
        import time
        invalid_payload = {
            "user_email": TEST_EMAIL,  # Wrong field name
            "exp": int(time.time()) + 3600
        }
        invalid_token = jwt.encode(invalid_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        response = await self.client.get(
            f"{self.base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        
        await self.print_response("Token Missing Sub", response)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Test 5 PASSED")

    async def simulate_inactive_user_test(self, user_id: str):
        """❌ Token valid, user inactive → returns 403"""
        print("\n📋 Test 6: Valid token + Inactive user")
        
        # This test would require direct database access to set user.is_active = False
        # For now, we'll just document what should happen:
        print("⚠️  Manual test required:")
        print(f"   1. Set user {user_id} is_active = False in database")
        print("   2. Call /api/auth/me with valid token")
        print("   3. Should return 403 with 'User is inactive' message")
        print("   4. Frontend should clear tokens and redirect to login")
        print("🔄 Test 6 REQUIRES MANUAL VERIFICATION")

    async def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Starting Authentication System Tests")
        print("=" * 60)
        
        try:
            # Setup
            test_data = await self.create_test_user()
            token = test_data["access_token"]
            user_id = test_data["user_id"]
            
            # Run tests
            await self.test_scenario_1_valid_active_user(token)
            await self.test_scenario_2_invalid_token()
            await self.test_scenario_3_expired_token()
            await self.test_scenario_4_no_token()
            await self.test_scenario_5_token_missing_sub()
            await self.simulate_inactive_user_test(user_id)
            
            print("\n🎉 ALL AUTOMATED TESTS PASSED!")
            print("📝 Please run the manual inactive user test separately")
            
        except Exception as e:
            print(f"\n❌ Test failed: {str(e)}")
            return False
        
        return True

async def main():
    """Main test runner"""
    tester = AuthTester()
    try:
        success = await tester.run_all_tests()
        sys.exit(0 if success else 1)
    finally:
        await tester.close()

if __name__ == "__main__":
    # Add the backend directory to path to import app modules
    import os
    backend_path = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_path)
    
    # Run the tests
    asyncio.run(main()) 