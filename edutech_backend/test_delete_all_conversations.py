import asyncio
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.database import get_db
from app.models.user import User
from app.models.chat import Conversation, Message
from app.utils.auth import get_password_hash, create_access_token

# Simple test to verify delete all conversations endpoint
async def test_delete_all_conversations_simple():
    """Test the delete all conversations endpoint"""
    print("Testing delete all conversations endpoint...")
    
    # This is a simple integration test that would require a proper test database setup
    # For now, it just verifies the endpoint structure
    
    from app.routers.chat import router
    
    # Check that the endpoint exists by examining route definitions
    routes_info = []
    for route in router.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes_info.append({
                'path': route.path,
                'methods': list(route.methods) if route.methods else []
            })
    
    print(f"Available routes: {routes_info}")
    
    # Check for DELETE /conversations endpoint
    delete_conversations_exists = any(
        route['path'] == '/chat/conversations' and 'DELETE' in route['methods']
        for route in routes_info
    )
    
    assert delete_conversations_exists, "DELETE /chat/conversations endpoint should exist"
    
    print("✓ Delete all conversations endpoint exists with DELETE method")
    print("✓ Test passed!")

if __name__ == "__main__":
    asyncio.run(test_delete_all_conversations_simple()) 