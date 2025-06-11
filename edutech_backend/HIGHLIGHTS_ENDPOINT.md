# 🔍 Highlights Endpoint Documentation

## New GET Endpoint: `/api/highlights/`

### Overview
This endpoint allows fetching all highlights for a specific lesson using a query parameter.

### URL
```
GET /api/highlights/?lesson_id={id}
```

### Parameters
- **lesson_id** (required): Integer ID of the lesson to get highlights for

### Authentication
- Requires valid JWT token in Authorization header
- Users can only access highlights for lessons they own

### Request Example
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:8000/api/highlights/?lesson_id=1"
```

### Response Examples

#### Success (200 OK)
```json
[
  {
    "id": 1,
    "user_id": 123,
    "lesson_id": 1,
    "category_id": null,
    "text": "Important concept to remember",
    "color": "yellow",
    "start_offset": 150,
    "end_offset": 180,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "user_id": 123,
    "lesson_id": 1,
    "category_id": null,
    "text": "Key definition",
    "color": "red",
    "start_offset": 300,
    "end_offset": 315,
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
]
```

#### Lesson Not Found (404 Not Found)
```json
{
  "detail": "Lesson not found or access denied"
}
```

#### Missing Parameter (422 Unprocessable Entity)
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "lesson_id"],
      "msg": "Field required"
    }
  ]
}
```

#### Unauthorized (401 Unauthorized)
```json
{
  "detail": "Invalid token"
}
```

### Security Features
1. **Authentication Required**: All requests must include valid JWT token
2. **User Authorization**: Users can only access highlights for their own lessons
3. **Lesson Ownership**: Endpoint verifies the lesson belongs to the authenticated user

### Comparison with Existing Endpoints

| Endpoint | Purpose | URL Pattern |
|----------|---------|-------------|
| **NEW** | Get highlights by lesson ID | `GET /api/highlights/?lesson_id=1` |
| Existing | Get highlights by lesson ID | `GET /api/highlights/lesson/1` |

The new endpoint provides the same functionality as the existing `/lesson/{lesson_id}` endpoint but uses query parameters instead of path parameters, which may be preferred for certain frontend implementations.

### Usage in Frontend

#### JavaScript/TypeScript Example
```typescript
const fetchHighlights = async (lessonId: number) => {
  const response = await fetch(
    `/api/highlights/?lesson_id=${lessonId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch highlights');
  }
  
  return response.json();
};
```

#### React Hook Example
```typescript
const useHighlights = (lessonId: number) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await api.get(`/highlights/?lesson_id=${lessonId}`);
        setHighlights(response.data);
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHighlights();
  }, [lessonId]);
  
  return { highlights, loading };
};
```

### Testing
Run the test script to verify the endpoint works correctly:

```bash
cd edutech_backend
python test_highlights_endpoint.py
```

The test script will verify:
1. ✅ Valid lesson ID returns highlights list
2. ❌ Invalid lesson ID returns 404
3. ❌ Missing lesson_id parameter returns 422
4. ❌ No authentication returns 401 