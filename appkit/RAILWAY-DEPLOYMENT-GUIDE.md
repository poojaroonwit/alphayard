# 🚂 **Railway Deployment Troubleshooting Guide**

## 🚨 **Current Issue: 401 Unauthorized + 404 Not Found**

### **Symptoms:**
- ❌ `POST /api/admin/applications` returns 401 Unauthorized
- ❌ `/api/debug/auth` returns 404 Not Found  
- ❌ `/api/health` returns 404 Not Found
- ❌ "message channel closed before response was received"

### **Root Cause:**
Railway deployment hasn't been updated with the latest code changes.

---

## 🔧 **Step 1: Force Railway Redeployment**

### **Method A: Railway Dashboard (Recommended)**
1. **Go to Railway Dashboard**: https://railway.app
2. **Select your appkit project**
3. **Click on the appkit service**
4. **Click "Redeploy"** button
5. **Wait for deployment to complete**

### **Method B: Git Trigger**
```bash
# Make a small change to trigger redeploy
git commit --allow-empty -m "trigger railway redeploy"
git push origin HEAD
```

### **Method C: Railway CLI**
```bash
# If you have Railway CLI installed
railway up
```

---

## 🔍 **Step 2: Verify Deployment**

### **Check Build Logs**
1. **Go to Railway Dashboard**
2. **Select appkit service**
3. **Click "Logs" tab**
4. **Look for build errors**

### **Check Environment Variables**
1. **Go to Railway Dashboard**
2. **Select appkit service**
3. **Click "Settings" → "Variables"**
4. **Verify these are set:**

```bash
# Required Variables
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
DATABASE_URL=postgresql://user:password@host:port/dbname
NODE_ENV=production
PORT=3001

# Optional but Recommended
ADMIN_EMAIL=admin@appkit.com
ADMIN_PASSWORD=change-this-password
NEXT_PUBLIC_SITE_URL=https://appkits.up.railway.app
```

---

## 🧪 **Step 3: Test After Deployment**

### **Test Health Endpoint**
```bash
curl https://appkits.up.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T...",
  "database": "connected",
  "version": "1.0.0"
}
```

### **Test Debug Endpoint**
```bash
curl https://appkits.up.railway.app/api/debug/auth
```

**Expected Response:**
```json
{
  "environment": {
    "NODE_ENV": "production",
    "JWT_SECRET_SET": true,
    "JWT_SECRET_LENGTH": 64,
    "JWT_SECRET_PLACEHOLDER": false
  },
  "database": {
    "connected": true,
    "adminUsers": 1,
    "adminEmails": [...]
  }
}
```

### **Test Applications API**
```bash
# First login to get token
curl -X POST https://appkits.up.railway.app/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@appkit.com","password":"change-this-password"}'

# Then use token to access applications
curl -X GET https://appkits.up.railway.app/api/v1/admin/applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚨 **Common Railway Issues**

### **Issue 1: Build Fails**
**Symptoms**: Deployment shows "Failed" status
**Solution**: Check Railway build logs for errors

### **Issue 2: Environment Variables Missing**
**Symptoms**: 401 errors, JWT_SECRET placeholder
**Solution**: Set all required environment variables

### **Issue 3: Database Connection**
**Symptoms**: Database connection errors
**Solution**: Verify DATABASE_URL is correct and accessible

### **Issue 4: Port Mismatch**
**Symptoms**: Can't access application
**Solution**: Ensure PORT=3001 is set

---

## 🔧 **Advanced Troubleshooting**

### **Check Railway Service Status**
```bash
# Using Railway CLI
railway status

# Check logs
railway logs
```

### **Manual Database Check**
```bash
# Connect to Railway database directly
psql $DATABASE_URL

# Check if admin user exists
SELECT * FROM "AdminUser" WHERE email = 'admin@appkit.com';
```

### **Clear Railway Cache**
```bash
# Restart the service
railway restart

# Or delete and recreate the service
railway delete
railway up
```

---

## 📋 **Deployment Checklist**

### **Before Deployment ✅**
- [ ] Latest code pushed to GitHub
- [ ] All environment variables set
- [ ] DATABASE_URL is correct
- [ ] JWT_SECRET is set (32+ chars)
- [ ] Railway service is active

### **After Deployment ✅**
- [ ] Health endpoint responds (200)
- [ ] Debug endpoint works
- [ ] Admin user exists in database
- [ ] Can login successfully
- [ ] API endpoints work with authentication

---

## 🚀 **Quick Fix Summary**

### **Immediate Actions:**
1. **Go to Railway Dashboard**
2. **Click "Redeploy" on appkit service**
3. **Wait for deployment to complete**
4. **Test health endpoint**
5. **Set JWT_SECRET if missing**

### **If Still Failing:**
1. **Check Railway build logs**
2. **Verify all environment variables**
3. **Ensure database is accessible**
4. **Try manual redeploy**

---

## 🎯 **Expected Timeline**

- **Redeployment**: 2-5 minutes
- **Health Check**: Should work immediately
- **Authentication**: Should work after JWT_SECRET is set
- **Full Functionality**: Should work within 10 minutes

---

## 📞 **Get Help**

### **Railway Support**
- **Dashboard**: https://railway.app
- **Documentation**: https://docs.railway.app
- **Status Page**: https://status.railway.app

### **Debug Information to Collect**
1. **Railway build logs**
2. **Environment variables (sensitive data redacted)**
3. **Health endpoint response**
4. **Debug endpoint response**

---

**The most common issue is that Railway needs to be manually redeployed to pick up the latest code changes!** 🚂
