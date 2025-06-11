import asyncio
import aiohttp
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

async def test_delete_message_endpoints():
    """Test the new delete message endpoints"""
    
    print("🧪 Testing Delete Message Endpoints", flush=True)
    print("=" * 50, flush=True)
    
    async with aiohttp.ClientSession() as session:
        # Test user credentials
        test_user = {
            "username": "testuser@example.com",
            "password": "testpassword123"
        }
        
        try:
            # 1. Login to get token
            print("1. Logging in...", flush=True)
            login_response = await session.post(
                f"{BASE_URL}/api/auth/login",
                data={
                    "username": test_user["username"],
                    "password": test_user["password"]
                }
            )
            
            if login_response.status != 200:
                print(f"❌ Login failed: {login_response.status}", flush=True)
                text = await login_response.text()
                print(f"Error: {text}", flush=True)
                return
            
            login_data = await login_response.json()
            token = login_data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Login successful", flush=True)
            
            # 2. Create a conversation with messages
            print("\n2. Creating conversation with messages...", flush=True)
            send_response = await session.post(
                f"{BASE_URL}/api/chat/send",
                json={"message": "What is Python?"},
                headers=headers
            )
            
            if send_response.status != 200:
                print(f"❌ Failed to send message: {send_response.status}", flush=True)
                text = await send_response.text()
                print(f"Error: {text}", flush=True)
                return
            
            send_data = await send_response.json()
            conversation_id = send_data["conversation"]["id"]
            print(f"✅ Created conversation {conversation_id}", flush=True)
            
            # 3. Send another message
            print("\n3. Sending another message...", flush=True)
            send_response2 = await session.post(
                f"{BASE_URL}/api/chat/send",
                json={"message": "Tell me about machine learning", "conversation_id": conversation_id},
                headers=headers
            )
            
            if send_response2.status != 200:
                print(f"❌ Failed to send second message: {send_response2.status}", flush=True)
                text = await send_response2.text()
                print(f"Error: {text}", flush=True)
                return
            
            print("✅ Sent second message", flush=True)
            
            # 4. Get conversation to see all messages
            print("\n4. Getting conversation messages...", flush=True)
            conv_response = await session.get(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}",
                headers=headers
            )
            
            if conv_response.status != 200:
                print(f"❌ Failed to get conversation: {conv_response.status}", flush=True)
                text = await conv_response.text()
                print(f"Error: {text}", flush=True)
                return
            
            conv_data = await conv_response.json()
            messages = conv_data["messages"]
            print(f"✅ Conversation has {len(messages)} messages", flush=True)
            
            if len(messages) == 0:
                print("❌ No messages found", flush=True)
                return
            
            # 5. Test deleting a specific message
            print("\n5. Testing delete specific message...", flush=True)
            message_to_delete = messages[0]["id"]
            print(f"Deleting message ID: {message_to_delete}", flush=True)
            delete_response = await session.delete(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}/messages/{message_to_delete}",
                headers=headers
            )
            
            if delete_response.status != 200:
                print(f"❌ Failed to delete message: {delete_response.status}", flush=True)
                text = await delete_response.text()
                print(f"Error: {text}", flush=True)
            else:
                delete_data = await delete_response.json()
                print(f"✅ {delete_data['message']}", flush=True)
            
            # 6. Verify message was deleted
            print("\n6. Verifying message deletion...", flush=True)
            conv_response2 = await session.get(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}",
                headers=headers
            )
            
            if conv_response2.status == 200:
                conv_data2 = await conv_response2.json()
                remaining_messages = conv_data2["messages"]
                print(f"✅ Conversation now has {len(remaining_messages)} messages", flush=True)
            
            # 7. Test clearing all messages
            print("\n7. Testing clear all messages...", flush=True)
            clear_response = await session.delete(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}/messages",
                headers=headers
            )
            
            if clear_response.status != 200:
                print(f"❌ Failed to clear messages: {clear_response.status}", flush=True)
                text = await clear_response.text()
                print(f"Error: {text}", flush=True)
            else:
                clear_data = await clear_response.json()
                print(f"✅ {clear_data['message']}", flush=True)
            
            # 8. Verify all messages cleared
            print("\n8. Verifying all messages cleared...", flush=True)
            conv_response3 = await session.get(
                f"{BASE_URL}/api/chat/conversations/{conversation_id}",
                headers=headers
            )
            
            if conv_response3.status == 200:
                conv_data3 = await conv_response3.json()
                final_messages = conv_data3["messages"]
                print(f"✅ Conversation now has {len(final_messages)} messages", flush=True)
            
            print("\n" + "=" * 50, flush=True)
            print("🎉 Delete Message Endpoints Test Complete!", flush=True)
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}", flush=True)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_delete_message_endpoints()) 