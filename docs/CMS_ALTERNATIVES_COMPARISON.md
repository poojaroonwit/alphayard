# Open-Source CMS/Admin Solutions for App Configuration Management

## Overview
You asked if there are open-source applications to control dynamic app configuration (like backgrounds, themes, content). **YES!** There are several excellent options that can work alongside or replace your custom admin dashboard.

---

## 🎯 Recommended Solutions

### **1. Directus (⭐ BEST FOR YOUR USE CASE)**

**What it is:** Open-source headless CMS & Data Platform

**Why it's perfect for you:**
- ✅ Works directly with your **existing PostgreSQL/Supabase database**
- ✅ Auto-generates admin UI from your database schema
- ✅ RESTful & GraphQL APIs out of the box
- ✅ Built-in asset management (images, videos, files)
- ✅ Role-based access control
- ✅ Real-time updates support
- ✅ Beautiful, modern admin interface
- ✅ No code changes needed - just point it to your DB

**Setup with your Supabase:**
```yaml
# Add to docker-compose.yml
directus:
  image: directus/directus:latest
  container_name: bondarys-directus
  ports:
    - "10008:8055"
  environment:
    KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
    SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'
    DB_CLIENT: 'pg'
    DB_HOST: 'supabase-db'
    DB_PORT: '5432'
    DB_DATABASE: 'postgres'
    DB_USER: 'postgres'
    DB_PASSWORD: 'postgres'
    ADMIN_EMAIL: 'admin@bondarys.com'
    ADMIN_PASSWORD: 'admin123'
    CORS_ENABLED: 'true'
    CORS_ORIGIN: '*'
  networks:
    - bondarys-network
  depends_on:
    - supabase-db
```

**What you get:**
- 📊 Admin UI for ALL your tables (users, families, content, assets, etc.)
- 🎨 Manage app_screens, app_assets, app_themes tables visually
- 📁 Built-in file manager for backgrounds/images
- 🔐 User authentication & permissions
- 🔄 Webhooks for triggering app updates
- 📱 Mobile-friendly admin interface

**Pricing:** 100% Free & Open Source
**GitHub:** https://github.com/directus/directus (25k+ stars)
**Demo:** https://demo.directus.io

---

### **2. Strapi (You Already Have This Configured!)**

**What it is:** Open-source headless CMS

**Why reconsider:**
- ✅ Beautiful admin UI
- ✅ Content type builder (visual schema designer)
- ✅ Media library
- ✅ RESTful & GraphQL APIs
- ✅ Plugin ecosystem
- ⚠️ Uses its own database (separate from Supabase)
- ⚠️ More complex setup than Directus

**Better approach with Strapi:**
Use it ONLY for marketing/static content, not family data:
- Marketing pages
- Blog posts
- FAQs
- Help documentation
- App store screenshots/descriptions

**Keep in docker-compose.yml but change usage:**
```yaml
strapi:
  image: strapi/strapi:latest
  container_name: bondarys-strapi-cms
  ports:
    - "10008:1337"
  environment:
    DATABASE_CLIENT: postgres
    DATABASE_HOST: supabase-db
    DATABASE_PORT: 5432
    DATABASE_NAME: strapi
    DATABASE_USERNAME: postgres
    DATABASE_PASSWORD: postgres
  depends_on:
    - supabase-db
```

**Pricing:** Free & Open Source
**GitHub:** https://github.com/strapi/strapi (60k+ stars)

---

### **3. Supabase Studio (You Already Have This!)**

**What it is:** Built-in admin interface for Supabase

**Access:** http://localhost:10007

**What you can do:**
- ✅ View/edit all database tables
- ✅ Manage users & authentication
- ✅ Configure storage buckets
- ✅ Write SQL queries
- ✅ Set up RLS policies
- ✅ View API logs
- ✅ Test APIs

**Why use it:**
- Already included in your setup
- No additional setup needed
- Direct database access
- Perfect for developers

**Limitations:**
- ❌ Not as user-friendly for non-technical admins
- ❌ No custom forms/workflows
- ❌ Basic asset management

---

### **4. Payload CMS (🚀 Modern Alternative)**

**What it is:** Headless CMS built with TypeScript & React

**Why it's interesting:**
- ✅ Built with TypeScript (like your app!)
- ✅ React-based admin UI
- ✅ Code-first configuration
- ✅ Excellent developer experience
- ✅ Built-in authentication
- ✅ Block-based editor
- ⚠️ Uses MongoDB by default (but supports PostgreSQL)

**Setup:**
```bash
npx create-payload-app@latest
```

**Pricing:** Free & Open Source
**GitHub:** https://github.com/payloadcms/payload (20k+ stars)
**Website:** https://payloadcms.com

---

### **5. KeystoneJS (Powerful but Complex)**

**What it is:** CMS + GraphQL API Platform

**Features:**
- ✅ GraphQL-first
- ✅ Uses Prisma ORM
- ✅ Supports PostgreSQL
- ✅ Customizable admin UI
- ⚠️ More complex setup
- ⚠️ Steeper learning curve

**Pricing:** Free & Open Source
**GitHub:** https://github.com/keystonejs/keystone (8k+ stars)

---

### **6. Sanity.io (Cloud-Based Option)**

**What it is:** Hosted headless CMS with excellent content management

**Features:**
- ✅ Amazing content editing experience
- ✅ Real-time collaboration
- ✅ Powerful query language (GROQ)
- ✅ Excellent image handling
- ✅ Portable Text (structured content)
- ⚠️ Hosted solution (not self-hosted)
- ⚠️ Separate database from your Supabase

**Pricing:**
- Free tier: 3 users, 10k documents
- Paid: $99/month for more

**Website:** https://www.sanity.io

---

## 📊 Comparison Table

| Feature | Directus | Strapi | Supabase Studio | Payload | Keystone | Sanity |
|---------|----------|--------|-----------------|---------|----------|--------|
| **Open Source** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Source available |
| **Self-Hosted** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Uses Your DB** | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ |
| **PostgreSQL** | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| **Auto Admin UI** | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ |
| **Asset Management** | ✅✅ | ✅✅ | ⚠️ | ✅ | ⚠️ | ✅✅ |
| **REST API** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GraphQL API** | ✅ | ✅ | ⚠️ | ✅ | ✅✅ | ✅ |
| **User-Friendly** | ✅✅ | ✅✅ | ⚠️ | ✅ | ⚠️ | ✅✅ |
| **Learning Curve** | Low | Medium | Low | Medium | High | Low |
| **Setup Time** | 5 min | 15 min | 0 min | 30 min | 1 hour | 10 min |
| **Best For** | Existing DB | New projects | Developers | TypeScript fans | GraphQL-first | Content teams |

---

## 🎯 My Recommendation for Your Project

### **Option 1: Directus (⭐ Best Choice)**

**Why:**
1. Works with your existing Supabase database
2. Auto-generates admin UI from your tables
3. No code changes needed
4. Manage app_configuration, app_screens, app_assets visually
5. 5-minute setup

**What you'd manage:**
- ✅ App screens (login background, splash screen)
- ✅ App assets (images, videos, icons)
- ✅ App themes
- ✅ Feature flags
- ✅ Content (family news, events, etc.)
- ✅ Users and families

**Setup Steps:**
```bash
# 1. Add to docker-compose.yml (see config above)
# 2. Start the container
docker-compose up -d directus

# 3. Access at http://localhost:10008
# 4. Login with admin credentials
# 5. Done! All your tables are now manageable via UI
```

---

### **Option 2: Keep Your Custom Next.js Admin + Add Directus**

**Why:**
- Use Next.js admin for business logic & custom workflows
- Use Directus for quick content/asset management
- Best of both worlds

**Setup:**
```yaml
# docker-compose.yml
admin-nextjs:
  # Your existing Next.js admin
  ports:
    - "3001:3000"

directus:
  # Directus for content management
  ports:
    - "10008:8055"
```

**Division of responsibilities:**
- **Next.js Admin:** Business logic, analytics, reports, complex workflows
- **Directus:** Content management, asset uploads, quick edits

---

### **Option 3: Supabase Studio Only (Minimal Approach)**

**Why:**
- Already included
- No additional setup
- Perfect for developers
- Direct database access

**Good for:**
- Small teams
- Developer-heavy teams
- Prototyping phase

---

## 🚀 Quick Start: Add Directus to Your Project

### Step 1: Update docker-compose.yml

```yaml
services:
  # ... your existing services ...

  directus:
    image: directus/directus:latest
    container_name: bondarys-directus
    restart: unless-stopped
    ports:
      - "10008:8055"
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'
      DB_CLIENT: 'pg'
      DB_HOST: 'supabase-db'
      DB_PORT: '5432'
      DB_DATABASE: 'postgres'
      DB_USER: 'postgres'
      DB_PASSWORD: 'postgres'
      ADMIN_EMAIL: 'admin@bondarys.com'
      ADMIN_PASSWORD: 'changeme123'
      PUBLIC_URL: 'http://localhost:10008'
      CORS_ENABLED: 'true'
      CORS_ORIGIN: 'true'
      STORAGE_LOCATIONS: 'local'
      STORAGE_LOCAL_ROOT: './uploads'
    volumes:
      - directus_uploads:/directus/uploads
    networks:
      - bondarys-network
    depends_on:
      supabase-db:
        condition: service_healthy

volumes:
  # ... existing volumes ...
  directus_uploads:
    driver: local
```

### Step 2: Start Directus

```bash
docker-compose up -d directus
```

### Step 3: Access Admin Panel

```
URL: http://localhost:10008
Email: admin@bondarys.com
Password: changeme123
```

### Step 4: Configure Collections

Directus will automatically detect your tables:
- ✅ app_configuration
- ✅ app_screens
- ✅ app_assets
- ✅ app_themes
- ✅ app_feature_flags
- ✅ content
- ✅ users
- ✅ families
- etc.

### Step 5: Manage Dynamic Content

Now you can:
1. **Upload login backgrounds** → app_assets table
2. **Edit login screen config** → app_screens table
3. **Change app theme** → app_themes table
4. **Toggle features** → app_feature_flags table
5. **Update branding** → app_configuration table

All through a beautiful UI! 🎉

---

## 📱 Example: Managing Login Background via Directus

### Without Directus (Manual):
```sql
-- Connect to database
psql -h localhost -U postgres -d postgres

-- Update login background
UPDATE app_assets 
SET asset_url = 'https://cdn.example.com/new-bg.jpg'
WHERE asset_key = 'login_background';
```

### With Directus:
1. Open Directus admin
2. Go to "App Assets" collection
3. Find "login_background"
4. Click edit
5. Upload new image or paste URL
6. Click save
7. Done! ✨

Your mobile app will fetch the new background on next launch.

---

## 🎨 Visual Content Management Workflow

```
Content Editor (Non-technical)
    ↓
Directus Admin UI (http://localhost:10008)
    ↓
Updates Supabase Database
    ↓
Mobile App fetches via API
    ↓
User sees updated content
```

**No code changes needed!** 🚀

---

## 💡 Best Practices

### 1. Use Directus for Content, Keep Next.js for Logic

```
┌─────────────────────────────────────┐
│   Next.js Admin (Business Logic)    │
│   - Analytics                        │
│   - Reports                          │
│   - Complex workflows                │
│   - User management                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Directus (Content Management)     │
│   - App configuration                │
│   - Assets (backgrounds, images)    │
│   - Dynamic content                  │
│   - Quick edits                      │
└─────────────────────────────────────┘

         Both use same Supabase DB
```

### 2. Set Up Roles

**Directus Roles:**
- **Admin:** Full access
- **Content Editor:** Can edit content, assets, screens
- **Viewer:** Read-only access

### 3. Use Webhooks

Directus can trigger webhooks when content changes:
```javascript
// Directus webhook
POST /api/cache/invalidate
{
  "collection": "app_assets",
  "action": "update",
  "key": "login_background"
}

// Your backend clears cache
// Mobile apps get fresh content
```

---

## 🔄 Migration Path

### Current State:
```
Custom Next.js Admin → Supabase → Mobile App
```

### Recommended State:
```
Directus (Content) ┐
                   ├→ Supabase → Mobile App
Next.js (Logic)    ┘
```

### Steps:
1. ✅ Add Directus to docker-compose.yml
2. ✅ Start Directus container
3. ✅ Configure permissions
4. ✅ Train team on Directus
5. ✅ Keep Next.js for custom features

---

## 📊 Cost Comparison

| Solution | Hosting Cost | Setup Time | Maintenance |
|----------|-------------|------------|-------------|
| **Directus (Self-hosted)** | $0 | 5 min | Low |
| **Strapi (Self-hosted)** | $0 | 15 min | Medium |
| **Custom Next.js Only** | $0 | High | High |
| **Sanity.io (Cloud)** | $0-99/mo | 10 min | Very Low |
| **Contentful (Cloud)** | $0-489/mo | 15 min | Very Low |

---

## 🎯 Final Recommendation

### For Your Project: **Directus + Keep Next.js Admin**

**Why:**
1. ✅ 5-minute setup
2. ✅ Uses existing database
3. ✅ Beautiful UI for content editors
4. ✅ Free & open source
5. ✅ Works alongside your Next.js admin
6. ✅ No code changes needed

**Result:**
- Content team manages app configuration via Directus
- Developers handle logic via Next.js admin
- Everyone is happy! 🎉

---

## 🚀 Quick Start Command

```bash
# Add Directus to your docker-compose.yml (see config above), then:
docker-compose up -d directus

# Access at: http://localhost:10008
# Login: admin@bondarys.com / changeme123

# Start managing your app configuration visually! 🎨
```

---

## 📚 Resources

- **Directus:** https://directus.io
- **Strapi:** https://strapi.io
- **Payload:** https://payloadcms.com
- **Keystone:** https://keystonejs.com
- **Sanity:** https://www.sanity.io

---

**Questions?** Let me know if you want me to set up Directus in your docker-compose.yml right now! 🚀

