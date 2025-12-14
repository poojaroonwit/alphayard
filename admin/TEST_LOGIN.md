# Login Testing Guide

## Issue: Redirecting to Marketing Page

### Current Setup:
- **Admin Panel**: Runs on `http://localhost:3001`
- **Marketing Website**: Runs on `http://localhost:5173` (Vite default)
- **Backend API**: Runs on `http://localhost:3000` (or 3001)

### Problem Diagnosis:

1. **Are you accessing the correct URL?**
   - ✅ Correct: `http://localhost:3001`
   - ❌ Wrong: `http://localhost:3000` (might be backend or another service)

2. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Try logging in with wrong credentials
   - Look for error messages

3. **Check Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Try logging in
   - Look for the login request and response

4. **Clear Browser Data**
   - Press F12 → Application tab → Storage
   - Clear all localStorage items
   - Refresh the page

### Testing Steps:

1. **Start the admin server:**
   ```bash
   cd admin
   npm run dev
   ```
   This should start on port 3001

2. **Access the admin:**
   Open: `http://localhost:3001`

3. **Test with WRONG credentials:**
   - Email: `wrong@test.com`
   - Password: `wrongpass`
   - Expected: Error badge should appear

4. **Test with CORRECT credentials:**
   - Email: `admin@bondarys.com`
   - Password: `admin123`
   - Expected: Should log in successfully

### If Still Redirecting:

Check these files for any hardcoded redirects:
- `admin/app/page.tsx` - Main app entry
- `admin/components/LoginForm.tsx` - Login form component
- `admin/components/Login.tsx` - Alternative login component
- `admin/services/authService.ts` - Authentication service

### Debug Commands:

In browser console, check:
```javascript
// Check current URL
console.log(window.location.href)

// Check localStorage
console.log(localStorage.getItem('admin_token'))
console.log(localStorage.getItem('admin_user'))

// Clear localStorage
localStorage.clear()
```
