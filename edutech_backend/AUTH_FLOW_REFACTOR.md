# Authentication Flow Refactor

## 📋 Overview

The authentication flow has been refactored to properly distinguish between **401 Unauthorized** and **403 Forbidden** errors, providing clearer error handling and better user experience.

## 🎯 Key Changes

### 1. **Enhanced User Model**
- Added `is_active` field to track user account status
- Default value: `True` (all users are active by default)
- Database migration: `add_user_is_active.py`

### 2. **Refactored Authentication Dependencies**

#### `get_current_user()` - Token Validation
- **Purpose**: Validates JWT token and retrieves user from database
- **Returns**: User object if token is valid and user exists
- **Raises 401** for:
  - Invalid/expired/tampered JWT tokens
  - Missing `sub` field in token payload
  - User not found in database
  - Database connection errors

#### `get_current_active_user()` - Account Status Check
- **Purpose**: Ensures the authenticated user has an active account
- **Depends on**: `get_current_user()`
- **Returns**: User object if user is active
- **Raises 403** for:
  - Valid token but user account is disabled (`is_active = False`)

### 3. **Updated Endpoints**

#### `/api/auth/me` 
- Uses `get_current_active_user()` dependency
- **Behavior**:
  - 200 OK → Valid token + active user
  - 401 Unauthorized → Invalid token or user not found
  - 403 Forbidden → Valid token but inactive user

#### `/api/auth/login` & `/api/auth/login-form`
- Added active account check during login
- **Behavior**:
  - 200 OK → Valid credentials + active account
  - 401 Unauthorized → Invalid credentials
  - 403 Forbidden → Valid credentials but inactive account

#### `/api/auth/refresh`
- Added active account check during token refresh
- **Behavior**:
  - 200 OK → Valid refresh token + active account
  - 401 Unauthorized → Invalid refresh token
  - 403 Forbidden → Valid refresh token but inactive account

## 🔍 Error Response Matrix

| Scenario | HTTP Status | Error Message | Description |
|----------|-------------|---------------|-------------|
| Valid token + active user | **200 OK** | ✅ Success | Normal operation |
| Invalid/expired token | **401 Unauthorized** | "Invalid or expired token" | Token validation failed |
| Token missing user ID | **401 Unauthorized** | "Token missing user identifier" | Malformed token payload |
| User not found in DB | **401 Unauthorized** | "User not found" | Token valid but user deleted |
| Valid token + inactive user | **403 Forbidden** | "Inactive user account. Please contact support." | Account disabled |
| No token provided | **403 Forbidden** | "Not authenticated" | FastAPI HTTPBearer default |

## 🔧 Technical Implementation

### Database Schema Changes

```sql
-- Migration: add_user_is_active.py
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

### Authentication Flow Diagram

```
Request to /api/auth/me
         ↓
[get_current_user()]
         ↓
   Validate JWT Token
         ↓
    ┌─── Invalid Token?
    │         ↓
    │    401 Unauthorized
    │
    └─── Valid Token
         ↓
   Query User from DB
         ↓
    ┌─── User Not Found?
    │         ↓
    │    401 Unauthorized
    │
    └─── User Found
         ↓
[get_current_active_user()]
         ↓
   Check is_active Status
         ↓
    ┌─── is_active = False?
    │         ↓
    │    403 Forbidden
    │
    └─── is_active = True
         ↓
      200 OK + User Data
```

### Code Examples

#### Valid Request
```bash
curl -H "Authorization: Bearer <valid_token>" \
     http://localhost:8000/auth/me
# Response: 200 OK
```

#### Invalid Token
```bash
curl -H "Authorization: Bearer invalid.token.here" \
     http://localhost:8000/auth/me
# Response: 401 Unauthorized
```

#### Inactive User Account
```sql
-- Simulate inactive user
UPDATE users SET is_active = FALSE WHERE email = 'user@example.com';
```
```bash
curl -H "Authorization: Bearer <valid_token_for_inactive_user>" \
     http://localhost:8000/auth/me
# Response: 403 Forbidden
```

## 🧪 Testing

### Running Tests
```bash
# Make sure FastAPI server is running
uvicorn app.main:app --reload

# Run authentication flow tests
python test_auth_scenarios.py
```

### Manual Testing Scenarios

1. **✅ Valid Active User**
   - Create user → Get token → Call `/auth/me`
   - Expected: 200 OK

2. **❌ Invalid Token**
   - Use malformed/expired token → Call `/auth/me`
   - Expected: 401 Unauthorized

3. **❌ Missing Token**
   - Call `/auth/me` without Authorization header
   - Expected: 403 Forbidden

4. **❌ Inactive User**
   - Set `is_active = FALSE` in database → Call `/auth/me`
   - Expected: 403 Forbidden

5. **❌ Deleted User**
   - Delete user from database but use valid token → Call `/auth/me`
   - Expected: 401 Unauthorized

## 🚀 Frontend Integration

### Updated Error Handling

```typescript
// Frontend API client (lib/api.ts)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token invalid or user not found
      // → Attempt token refresh or redirect to login
      return handleTokenRefresh(error.config)
    } else if (error.response?.status === 403) {
      // User account disabled
      // → Show account disabled message + logout
      showAccountDisabledMessage()
      return logoutUser()
    }
    return Promise.reject(error)
  }
)
```

### Error Messages for Users

- **401 Errors**: "Session expired. Please log in again."
- **403 Errors**: "Your account has been disabled. Please contact support."

## 📚 Benefits

### 1. **Clear Error Distinction**
- Developers can easily distinguish between authentication and authorization issues
- Better debugging and troubleshooting experience

### 2. **Enhanced Security**
- Inactive accounts cannot access protected resources
- Clear separation between token validation and account status

### 3. **Better User Experience**
- Specific error messages guide users to appropriate actions
- Account status management for administrators

### 4. **Compliance Ready**
- Support for account suspension/deactivation
- Audit trail capabilities for user access control

## 🔒 Security Considerations

### Token Validation
- JWT signature verification using `jose` library
- Proper error handling without information leakage
- Consistent use of secure headers

### Account Management
- Active status check on every protected request
- Immediate effect when account is disabled
- No bypass mechanisms for inactive accounts

### Error Response Security
- Generic error messages to prevent user enumeration
- Consistent response format and timing
- No sensitive information in error details

## 🛠 Migration Guide

### Database Migration
```bash
# Run Alembic migration
alembic upgrade head
```

### Existing User Data
- All existing users will have `is_active = TRUE` by default
- No manual data migration required
- Account status can be modified via admin interface

### API Clients
- Update error handling for 403 Forbidden responses
- Implement account disabled user flow
- Test with inactive user scenarios

---

**Implementation Status**: ✅ **Complete**

The authentication flow now properly distinguishes between 401 and 403 errors, providing a robust foundation for user account management and security. 