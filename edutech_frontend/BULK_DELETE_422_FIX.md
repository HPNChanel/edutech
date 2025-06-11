# Bulk Delete 422 Error Fix

## Problem
The bulk delete endpoint was returning a 422 Unprocessable Entity error when called from the frontend.

## Root Cause
The backend endpoint was expecting `conversation_ids: List[int]` as a direct parameter, but when sending a DELETE request with a request body, FastAPI requires the data to be wrapped in a Pydantic model.

### Original Backend Code (Incorrect)
```python
@router.delete("/conversations/bulk")
async def delete_selected_conversations(
    conversation_ids: List[int],  # ❌ This doesn't work with request body
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
```

### Original Frontend Code (Sending Array Directly)
```typescript
const response = await api.delete(`${this.baseEndpoint}/conversations/bulk`, {
  data: conversationIds  // ❌ Sending array directly
})
```

## Solution

### 1. Created Pydantic Schema
Added `BulkDeleteRequest` schema in `edutech_backend/app/schemas/chat.py`:
```python
class BulkDeleteRequest(BaseModel):
    conversation_ids: List[int] = Field(..., min_length=1, description="List of conversation IDs to delete")
```

### 2. Updated Backend Endpoint
Modified the endpoint to use the schema:
```python
@router.delete("/conversations/bulk")
async def delete_selected_conversations(
    request: BulkDeleteRequest,  # ✅ Using Pydantic model
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # ... use request.conversation_ids
```

### 3. Updated Frontend Request Format
Modified the frontend to send an object instead of an array:
```typescript
const response = await api.delete(`${this.baseEndpoint}/conversations/bulk`, {
  data: { conversation_ids: conversationIds }  // ✅ Sending object with proper structure
})
```

## Request/Response Format

### Request Format
```json
{
  "conversation_ids": [1, 2, 3, 4, 5]
}
```

### Response Format
```json
{
  "message": "Successfully deleted 3 conversations, 2 failed",
  "deleted_count": 3,
  "failed_count": 2
}
```

## Validation Features

### Schema Validation
- ✅ Requires at least 1 conversation ID
- ✅ Validates all IDs are integers
- ✅ Proper error messages for invalid data

### Backend Validation
- ✅ User authentication required
- ✅ Ownership verification for each conversation
- ✅ Individual error handling per conversation
- ✅ Transaction safety with rollback

## Testing

### Schema Validation Test
```python
# Valid request
valid_request = BulkDeleteRequest(conversation_ids=[1, 2, 3])

# Invalid request (empty list)
empty_request = BulkDeleteRequest(conversation_ids=[])  # Raises ValidationError
```

### Integration Test
- ✅ Endpoint accepts correct JSON format
- ✅ Returns 403 (auth required) instead of 422 (format error)
- ✅ Proper error handling for malformed requests

## Error Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | Success | Conversations deleted successfully |
| 400 | Bad Request | Empty conversation_ids list |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User not authenticated properly |
| 422 | Unprocessable Entity | Invalid request format (should be fixed now) |
| 500 | Internal Server Error | Database or server error |

## Verification Steps

1. **Backend Test**: Run schema validation test
   ```bash
   python test_bulk_delete_format.py
   ```

2. **Frontend Test**: Check browser network tab
   - Request should show `{"conversation_ids": [1,2,3]}`
   - Response should be 200 OK (if authenticated) or 401/403 (if not authenticated)
   - Should NOT see 422 errors

3. **End-to-End Test**: 
   - Select multiple conversations in UI
   - Click "Delete Selected"
   - Should succeed or show proper auth error, not format error

## Status
✅ **FIXED**: The 422 Unprocessable Entity error has been resolved by properly structuring the request data format and using Pydantic schema validation. 