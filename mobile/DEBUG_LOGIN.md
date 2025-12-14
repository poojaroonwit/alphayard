# Debug Login Issue

## Steps to Debug

### 1. Open Browser DevTools
Press **F12** in your browser to open DevTools, then go to the **Console** tab.

### 2. Try to Login Again
1. Go to http://localhost:8081
2. Click "Login"
3. Enter credentials
4. Click "Sign in"
5. Watch the console output

### 3. Look for These Key Messages

#### If Login is Successful:
```
[AUTH] ✅ Login successful - setting user state
[AUTH] ✅ User object: {id: "...", email: "..."}
[AUTH] ✅✅✅ All states set - isAuthenticated should now be: true
```

#### If Login Fails:
```
Login error: ...
🔧 Login error caught: ...
```

#### Navigation State:
```
[RootNavigator] Rendering - isAuthenticated: true/false
[RootNavigator] shouldShowAuthenticated: true/false
[RootNavigator] User object check: {hasUser: ..., hasId: ..., hasEmail: ...}
```

#### If Redirecting to Marketing:
```
[MarketingScreen] ⚠️ BLOCKED: Authenticated user tried to access Marketing screen
[AuthNavigator] ⚠️ CRITICAL ERROR: AuthNavigator rendered when user is authenticated
```

### 4. Check Network Tab
1. Go to **Network** tab in DevTools
2. Try to login
3. Look for the login request (usually `/auth/login` or `/api/auth/login`)
4. Check the response:
   - **Status**: Should be 200
   - **Response**: Should contain `user` and `token`/`accessToken`

### 5. Common Issues

#### Issue 1: Backend Not Running
**Symptoms**:
- Network request fails
- Error: "Network Error" or "Failed to fetch"

**Solution**:
```bash
# Start the backend
cd backend
npm run dev
```

#### Issue 2: Wrong Backend URL
**Symptoms**:
- Request goes to wrong URL
- 404 Not Found

**Check**: Look at the API base URL in the network request

#### Issue 3: Login Returns Error
**Symptoms**:
- Status 401 or 400
- Error message in response

**Solution**: Check credentials are correct

#### Issue 4: User Object Missing Fields
**Symptoms**:
- Login succeeds but still redirects
- Console shows: `hasId: false` or `hasEmail: false`

**Check**: The response from backend should have:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "..."
  },
  "token": "..." or "accessToken": "..."
}
```

#### Issue 5: State Not Updating
**Symptoms**:
- Login succeeds
- Console shows user object
- But `isAuthenticated` stays false

**This is the navigation bug we're trying to fix**

### 6. Manual Test in Console

You can test the auth state manually in the browser console:

```javascript
// Check if user is logged in
console.log('Auth state:', window.__AUTH_STATE__);

// Try to manually set user (for testing)
// This won't work in production but helps debug
```

### 7. Clear Browser Storage

Sometimes old data causes issues:

1. Open DevTools
2. Go to **Application** tab
3. Click **Clear storage**
4. Click **Clear site data**
5. Reload page and try again

### 8. Check AsyncStorage

The app stores tokens in AsyncStorage. On web, this is localStorage:

```javascript
// Check stored tokens in browser console
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
```

## What to Share

If the issue persists, please share:

1. **Console logs** - Copy all messages from the Console tab
2. **Network request** - Screenshot of the login request/response
3. **What you see** - Describe what happens after clicking "Sign in"
4. **Backend status** - Is the backend running? What URL?

## Quick Fixes to Try

### Fix 1: Hard Reload
Press **Ctrl+Shift+R** to hard reload the page (clears cache)

### Fix 2: Clear Metro Cache
Already done! Metro was restarted with `--clear` flag.

### Fix 3: Check Backend
```bash
# In a new terminal
cd backend
npm run dev
```

### Fix 4: Use Test Credentials
Make sure you're using valid test credentials that exist in the database.

---

**Next**: Try logging in again and share the console output!
