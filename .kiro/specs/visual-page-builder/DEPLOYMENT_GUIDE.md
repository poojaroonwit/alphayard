# Visual Page Builder - Deployment Guide

This guide covers deploying the Page Builder backend to production.

## Pre-Deployment Checklist

### ✅ Backend Ready
- [x] Database migration created
- [x] All controllers implemented
- [x] All routes configured
- [x] Error handling in place
- [x] Authentication configured
- [x] Asset storage configured

### 📋 Before Deploying

- [ ] Run database migration
- [ ] Install required npm packages
- [ ] Configure environment variables
- [ ] Set up Supabase Storage bucket
- [ ] Test all endpoints
- [ ] Configure CORS for production domains
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limiting

---

## Environment Setup

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-production-secret-key-change-this

# Server
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL=https://your-admin-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10mb
```

### Install Dependencies

```bash
cd backend
npm install
npm install node-cron @types/node-cron uuid @types/uuid
```

---

## Database Setup

### 1. Run Migration

```bash
cd backend
node setup/08-run-page-builder-migration.js
```

### 2. Verify Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'page%' OR table_name IN ('templates', 'component_definitions'));
```

Should return 8 tables.

### 3. Verify Default Data

```sql
-- Check components
SELECT COUNT(*) FROM component_definitions;
-- Should return 9

-- Check templates
SELECT COUNT(*) FROM templates;
-- Should return 4
```

---

## Supabase Storage Setup

### Create Assets Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `assets`
4. Public: Yes (or configure RLS)
5. Click "Create"

### Configure CORS (if needed)

In Supabase Dashboard → Storage → Configuration:

```json
[
  {
    "allowedOrigins": ["https://your-domain.com"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

---

## Deployment Options

### Option 1: Deploy to Vercel/Netlify (Serverless)

**Not Recommended** - The backend uses Express.js and requires a persistent server for cron jobs.

### Option 2: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set DATABASE_URL="your-database-url"
railway variables set SUPABASE_URL="your-supabase-url"
# ... add all other variables

# Deploy
railway up
```

### Option 3: Deploy to Render

1. Create new Web Service
2. Connect your GitHub repo
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables
6. Deploy

### Option 4: Deploy to DigitalOcean App Platform

1. Create new App
2. Select your repo
3. Configure:
   - Build Command: `cd backend && npm install && npm run build`
   - Run Command: `cd backend && npm start`
4. Add environment variables
5. Deploy

### Option 5: Deploy to AWS/GCP/Azure (VPS)

```bash
# SSH into your server
ssh user@your-server.com

# Clone repo
git clone your-repo-url
cd your-repo/backend

# Install dependencies
npm install
npm install node-cron @types/node-cron uuid @types/uuid

# Build TypeScript
npm run build

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Run migration
node setup/08-run-page-builder-migration.js

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start dist/server.js --name page-builder-api

# Save PM2 config
pm2 save
pm2 startup
```

---

## Production Configuration

### Update CORS Settings

In `backend/src/server.ts`, update allowed origins:

```typescript
const allowedOrigins = [
  'https://your-admin-domain.com',
  'https://your-website.com',
  // Add production domains
];
```

### Enable Rate Limiting

Already configured in server.ts, but verify settings:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Configure Helmet Security Headers

Already configured, but review settings:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));
```

---

## Scheduled Publishing Setup

### Enable Cron Service

In `backend/src/server.ts`, add after server initialization:

```typescript
import { scheduledPublishingService } from './services/scheduledPublishingService';

// Start scheduled publishing service
if (process.env.NODE_ENV === 'production') {
  scheduledPublishingService.start();
  console.log('✅ Scheduled publishing service started');
}
```

### Alternative: External Cron Job

If your hosting doesn't support long-running processes, set up an external cron:

```bash
# Add to crontab (runs every minute)
* * * * * curl -X POST https://your-api.com/api/page-builder/pages/process-scheduled \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (if self-hosting)

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d api.your-domain.com

# Update server to use SSL
# Add to server.ts:
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.your-domain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.your-domain.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

### Using Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Enable SSL/TLS (Full or Full Strict)
3. Enable "Always Use HTTPS"
4. Configure firewall rules if needed

---

## Monitoring & Logging

### Set Up Error Tracking

Already configured with Sentry. Add to environment:

```env
SENTRY_DSN=your-sentry-dsn
```

### Set Up Logging

Consider adding:
- **Winston** for structured logging
- **Morgan** for HTTP request logging (already included)
- **PM2 logs** for process monitoring

```bash
# View PM2 logs
pm2 logs page-builder-api

# View last 100 lines
pm2 logs page-builder-api --lines 100
```

### Health Check Monitoring

Set up monitoring service to ping:
```
https://your-api.com/health
```

Recommended services:
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## Performance Optimization

### Enable Compression

Already configured in server.ts:

```typescript
app.use(compression({
  level: 6,
  threshold: 1024
}));
```

### Database Connection Pooling

Configure in your DATABASE_URL:

```
postgresql://user:password@host:port/database?pool_size=20
```

### Redis Caching (Optional)

For high-traffic sites, add Redis:

```bash
npm install redis ioredis
```

Configure caching for:
- Component definitions
- Templates
- Published pages

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/page_builder_$DATE.sql
```

### Asset Backups

Supabase Storage has built-in backups, but consider:
- Regular exports to S3/GCS
- Versioning enabled on storage bucket

---

## Post-Deployment Testing

### 1. Test Health Endpoint

```bash
curl https://your-api.com/health
```

### 2. Test Authentication

```bash
curl -X POST https://your-api.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### 3. Run Full Test Suite

```bash
API_URL=https://your-api.com node backend/test-page-builder.js
```

### 4. Test Asset Upload

```bash
curl -X POST https://your-api.com/api/page-builder/assets/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg"
```

### 5. Test Scheduled Publishing

```bash
# Create a scheduled page
curl -X POST https://your-api.com/api/page-builder/pages/:id/schedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduledFor":"2025-12-04T10:00:00Z"}'

# Wait and verify it publishes
```

---

## Troubleshooting

### Issue: Database Connection Fails

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check firewall rules
# Ensure your server IP is whitelisted
```

### Issue: Asset Upload Fails

```bash
# Verify Supabase Storage bucket exists
# Check SUPABASE_SERVICE_KEY is correct
# Verify bucket permissions
```

### Issue: CORS Errors

```bash
# Check allowed origins in server.ts
# Verify FRONTEND_URL environment variable
# Check browser console for specific error
```

### Issue: High Memory Usage

```bash
# Check for memory leaks
pm2 monit

# Restart if needed
pm2 restart page-builder-api

# Consider increasing server resources
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Implement API key rotation
- [ ] Set up 2FA for admin accounts

---

## Rollback Plan

### If Deployment Fails

```bash
# Revert to previous version
git revert HEAD
git push

# Or rollback on hosting platform
railway rollback  # Railway
# or use platform-specific rollback
```

### If Migration Fails

```bash
# Rollback migration (see migration file for DROP statements)
psql $DATABASE_URL -f backend/src/migrations/rollback_013.sql
```

---

## Next Steps After Deployment

1. ✅ Backend deployed and running
2. ✅ Database migrated
3. ✅ Assets storage configured
4. ✅ Monitoring set up

**Now you can:**
- Build the frontend admin interface
- Create custom components
- Build page templates
- Start creating pages!

---

## Support & Maintenance

### Regular Maintenance Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### Useful Commands

```bash
# Check server status
pm2 status

# View logs
pm2 logs page-builder-api

# Restart server
pm2 restart page-builder-api

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('your_db'));"

# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-api.com/health
```

---

**Deployment Complete!** 🚀

Your Page Builder backend is now live and ready for production use!
