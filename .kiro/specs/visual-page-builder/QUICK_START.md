# Visual Page Builder - Quick Start Guide

Get the page builder backend up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- Backend server running

## Step 1: Install Dependencies

```bash
cd backend

# Install required packages if not already installed
npm install node-cron @types/node-cron uuid @types/uuid
```

## Step 2: Configure Environment

Make sure your `.env` file has these variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bondarys

# Supabase (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3000
NODE_ENV=development
```

## Step 3: Run Database Migration

```bash
cd backend
node setup/08-run-page-builder-migration.js
```

You should see:
```
✅ Connected to database
📋 Running Page Builder Migration:
   File: 013_page_builder.sql
✅ Migration applied
✅ Page Builder migration completed successfully!
```

## Step 4: Create Supabase Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New Bucket**
4. Name it: `assets`
5. Set to **Public** (or configure RLS policies)
6. Click **Create**

## Step 5: Start the Server

```bash
cd backend

# Option 1: Full TypeScript server
npm run dev

# Option 2: Simple server (for testing)
node simple-server.js
```

## Step 6: Test the API

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Get Admin Token (Simple Server)
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Save the token from the response.

### Test Page Builder Endpoints

```bash
# Set your token
TOKEN="your-token-here"

# Get all pages
curl http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN"

# Get all components
curl http://localhost:3000/api/page-builder/components \
  -H "Authorization: Bearer $TOKEN"

# Get all templates
curl http://localhost:3000/api/page-builder/templates \
  -H "Authorization: Bearer $TOKEN"

# Create a new page
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Page",
    "slug": "my-first-page",
    "description": "This is my first page",
    "components": [
      {
        "componentType": "Hero",
        "position": 0,
        "props": {
          "heading": "Welcome to My Page",
          "subheading": "Built with the Page Builder"
        }
      }
    ]
  }'
```

## Step 7: Verify Database

Connect to your database and verify the tables were created:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'page%' OR table_name IN ('templates', 'component_definitions'));

-- Check default components
SELECT name, category FROM component_definitions ORDER BY category, name;

-- Check default templates
SELECT name, category FROM templates ORDER BY name;
```

You should see:
- 8 tables created
- 9 component definitions
- 4 templates

## 🎉 Success!

Your page builder backend is now running! You should have:

✅ Database tables created  
✅ Default components loaded  
✅ Default templates loaded  
✅ API endpoints responding  
✅ Asset storage configured  

## Next Steps

### Option 1: Test with Postman/Insomnia

Import the API endpoints and start testing:
- Create pages
- Add components
- Upload assets
- Publish pages

### Option 2: Build the Frontend

Start implementing the admin console interface:
```bash
cd admin
npm install
npm run dev
```

Then navigate to `http://localhost:3001` and start building the page builder UI!

### Option 3: Explore the API

Check out the full API documentation in `IMPLEMENTATION_STATUS.md` for all 60+ endpoints.

## Troubleshooting

### Migration Fails

**Error**: `relation "users" does not exist`
- **Solution**: Run base migrations first

**Error**: `function gen_random_uuid() does not exist`
- **Solution**: Enable pgcrypto extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ```

### Storage Upload Fails

**Error**: `Bucket not found`
- **Solution**: Create the `assets` bucket in Supabase Dashboard

**Error**: `Permission denied`
- **Solution**: Make bucket public or configure RLS policies

### Authentication Fails

**Error**: `No token provided`
- **Solution**: Make sure you're sending the Authorization header:
  ```
  Authorization: Bearer YOUR_TOKEN
  ```

### Server Won't Start

**Error**: `Port 3000 already in use`
- **Solution**: Change PORT in `.env` or kill the process using port 3000

## Useful Commands

```bash
# Check if server is running
curl http://localhost:3000/health

# View server logs
cd backend
npm run dev

# Run migration again (safe to run multiple times)
node setup/08-run-page-builder-migration.js

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pages;"
```

## Support

For issues or questions:
1. Check `IMPLEMENTATION_STATUS.md` for detailed documentation
2. Review the requirements in `requirements.md`
3. Check the design document in `design.md`
4. Review the task list in `tasks.md`

## What's Next?

Now that the backend is running, you can:

1. **Test the API** - Use Postman/curl to test all endpoints
2. **Build the Frontend** - Start implementing the admin UI
3. **Add Custom Components** - Create your own component definitions
4. **Create Templates** - Build reusable page templates
5. **Configure Workflows** - Set up approval workflows for publishing

Happy building! 🚀
