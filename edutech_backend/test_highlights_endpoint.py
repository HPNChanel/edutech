#!/usr/bin/env python3
"""
Test script for the new GET /api/highlights/?lesson_id={id} endpoint

This script tests:
1. GET /api/highlights/?lesson_id=1 with valid authentication
2. GET /api/highlights/?lesson_id=999 with non-existent lesson
3. GET /api/highlights/ without lesson_id parameter (should fail)
4. GET /api/highlights/?lesson_id=1 without authentication (should fail)

Run with: python test_highlights_endpoint.py
"""

import asyncio
import json
import sys
from typing import Dict, Any

import httpx

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test_highlights_user@example.com"
TEST_PASSWORD = "TestPassword123!"
TEST_NAME = "Test Highlights User"

class HighlightsEndpointTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.access_token = None
        
    async def close(self):
        await self.client.aclose()

    async def print_response(self, description: str, response: httpx.Response):
        """Print response details for debugging"""
        print(f"\n🧪 {description}")
        print(f"   Status: {response.status_code}")
        if response.content:
            try:
                content = response.json()
                print(f"   Body: {json.dumps(content, indent=2)}")
            except:
                print(f"   Body: {response.text}")
        print("-" * 50)

    async def setup_test_user(self) -> str:
        """Create test user and return access token"""
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
            self.access_token = data["tokens"]["accessToken"]
            return self.access_token
        else:
            print(f"❌ Failed to create test user: {response.status_code} - {response.text}")
            raise Exception("Test user creation failed")

    async def create_test_lesson(self) -> int:
        """Create a test lesson and return its ID"""
        print("📝 Creating test lesson...")
        
        lesson_data = {
            "title": "Test Lesson for Highlights",
            "content": "This is a test lesson content for highlighting."
        }
        
        response = await self.client.post(
            f"{self.base_url}/api/lessons/",
            json=lesson_data,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["id"]
        else:
            print(f"❌ Failed to create test lesson: {response.status_code} - {response.text}")
            raise Exception("Test lesson creation failed")

    async def test_1_valid_lesson_id(self, lesson_id: int):
        """✅ Test GET /api/highlights/?lesson_id={valid_id} with authentication"""
        print(f"\n📋 Test 1: GET /api/highlights/?lesson_id={lesson_id} (Valid)")
        
        response = await self.client.get(
            f"{self.base_url}/api/highlights/?lesson_id={lesson_id}",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        await self.print_response("Valid lesson ID with auth", response)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print("✅ Test 1 PASSED")

    async def test_2_invalid_lesson_id(self):
        """❌ Test GET /api/highlights/?lesson_id=999 (non-existent lesson)"""
        print("\n📋 Test 2: GET /api/highlights/?lesson_id=999 (Invalid lesson)")
        
        response = await self.client.get(
            f"{self.base_url}/api/highlights/?lesson_id=999",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        await self.print_response("Invalid lesson ID", response)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Test 2 PASSED")

    async def test_3_missing_lesson_id_parameter(self):
        """❌ Test GET /api/highlights/ without lesson_id parameter"""
        print("\n📋 Test 3: GET /api/highlights/ (Missing lesson_id parameter)")
        
        response = await self.client.get(
            f"{self.base_url}/api/highlights/",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        await self.print_response("Missing lesson_id parameter", response)
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✅ Test 3 PASSED")

    async def test_4_no_authentication(self):
        """❌ Test GET /api/highlights/?lesson_id=1 without authentication"""
        print("\n📋 Test 4: GET /api/highlights/?lesson_id=1 (No authentication)")
        
        response = await self.client.get(
            f"{self.base_url}/api/highlights/?lesson_id=1"
        )
        
        await self.print_response("No authentication", response)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Test 4 PASSED")

    async def run_all_tests(self):
        """Run all tests for the highlights endpoint"""
        print("🚀 Starting Highlights Endpoint Tests")
        print("=" * 60)
        
        try:
            # Setup
            await self.setup_test_user()
            lesson_id = await self.create_test_lesson()
            
            # Run tests
            await self.test_1_valid_lesson_id(lesson_id)
            await self.test_2_invalid_lesson_id()
            await self.test_3_missing_lesson_id_parameter()
            await self.test_4_no_authentication()
            
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ The new GET /api/highlights/?lesson_id={id} endpoint is working correctly!")
            
        except Exception as e:
            print(f"\n❌ Test failed: {str(e)}")
            return False
        
        return True

async def main():
    """Main test runner"""
    tester = HighlightsEndpointTester()
    try:
        success = await tester.run_all_tests()
        sys.exit(0 if success else 1)
    finally:
        await tester.close()

if __name__ == "__main__":
    # Run the tests
    asyncio.run(main()) 