"""
Simple test to check OpenAI configuration
"""
from app.config import settings
from app.services.openai_service import openai_service
import requests
import json

def test_openai_config():
    print("=== OpenAI Configuration Test ===")
    print(f"API Key configured: {'Yes' if settings.OPENAI_API_KEY else 'No'}")
    print(f"API Key length: {len(settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else 0}")
    print(f"Model: {settings.OPENAI_MODEL}")
    print(f"Max tokens: {settings.OPENAI_MAX_TOKENS}")
    print(f"Temperature: {settings.OPENAI_TEMPERATURE}")
    
    print(f"\nValidation result: {openai_service.validate_api_key()}")

BASE_URL = "http://localhost:8000"

def test_delete_endpoints():
    """Simple test for delete endpoints using requests"""
    
    print("🧪 Testing Delete Message Endpoints")
    print("=" * 50)
    
    # Test user credentials  
    test_user = {
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    
    try:
        # 1. Login
        print("1. Logging in...")
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=test_user
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Error: {login_response.text}")
            return
        
        token = login_response.json()["tokens"]["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
        
        # 2. Create a conversation
        print("\n2. Creating conversation...")
        send_response = requests.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": "Hello, test message for deletion"},
            headers=headers
        )
        
        if send_response.status_code != 200:
            print(f"❌ Failed to create conversation: {send_response.status_code}")
            print(f"Error: {send_response.text}")
            return
        
        conversation_id = send_response.json()["conversation"]["id"]
        print(f"✅ Created conversation {conversation_id}")
        
        # 3. Get messages
        print("\n3. Getting conversation messages...")
        conv_response = requests.get(
            f"{BASE_URL}/api/chat/conversations/{conversation_id}",
            headers=headers
        )
        
        if conv_response.status_code != 200:
            print(f"❌ Failed to get conversation: {conv_response.status_code}")
            return
        
        messages = conv_response.json()["messages"]
        print(f"✅ Found {len(messages)} messages")
        
        if len(messages) > 0:
            # 4. Test delete specific message
            print("\n4. Testing delete specific message...")
            message_id = messages[0]["id"]
            delete_response = requests.delete(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}/messages/{message_id}",
                headers=headers
            )
            
            print(f"Delete response status: {delete_response.status_code}")
            print(f"Delete response: {delete_response.text}")
            
            # 5. Test clear all messages
            print("\n5. Testing clear all messages...")
            clear_response = requests.delete(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}/messages",
                headers=headers
            )
            
            print(f"Clear response status: {clear_response.status_code}")
            print(f"Clear response: {clear_response.text}")
        
        print("\n" + "=" * 50)
        print("🎉 Test Complete!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_openai_config()
    test_delete_endpoints() 