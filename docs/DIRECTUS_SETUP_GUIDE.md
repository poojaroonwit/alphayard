# Directus Setup Guide - Quick Start

## What is Directus?

**Directus** is an open-source headless CMS that gives you a beautiful admin interface for **your existing database**. Think of it as a visual database manager that non-technical people can use.

### Why Directus is Perfect for You:
- ✅ Works with your existing Supabase PostgreSQL database
- ✅ Auto-generates admin UI from your database tables
- ✅ No code changes needed
- ✅ Beautiful, modern interface
- ✅ 100% free and open source
- ✅ 5-minute setup

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Add to docker-compose.yml

Add this service to your `docker-compose.yml`:

```yaml
services:
  # ... your existing services (supabase-db, redis, backend, etc.) ...

  # Directus CMS - Admin UI for Database
  directus:
    image: directus/directus:latest
    container_name: bondarys-directus
    restart: unless-stopped
    ports:
      - "10008:8055"
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'
      
      # Database Connection (uses your Supabase DB)
      DB_CLIENT: 'pg'
      DB_HOST: 'supabase-db'
      DB_PORT: '5432'
      DB_DATABASE: 'postgres'
      DB_USER: 'postgres'
      DB_PASSWORD: 'postgres'
      
      # Admin Account
      ADMIN_EMAIL: 'admin@bondarys.com'
      ADMIN_PASSWORD: 'BondarysCMS2024!'
      
      # URLs and CORS
      PUBLIC_URL: 'http://localhost:10008'
      CORS_ENABLED: 'true'
      CORS_ORIGIN: 'true'
      
      # Storage
      STORAGE_LOCATIONS: 'local'
      STORAGE_LOCAL_ROOT: './uploads'
      
      # File Upload Limits
      MAX_PAYLOAD_SIZE: '50mb'
      
      # Rate Limiting (optional)
      RATE_LIMITER_ENABLED: 'false'
      
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    networks:
      - bondarys-network
    depends_on:
      supabase-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  # ... your existing volumes ...
  directus_uploads:
    driver: local
  directus_extensions:
    driver: local
```

### Step 2: Start Directus

```bash
# Start the container
docker-compose up -d directus

# Check logs
docker-compose logs -f directus

# Wait for "Server started" message
```

### Step 3: Access Admin Panel

Open your browser and go to:
```
http://localhost:10008
```

**Login Credentials:**
- Email: `admin@bondarys.com`
- Password: `BondarysCMS2024!`

### Step 4: Done! 🎉

You now have a visual admin interface for ALL your database tables!

---

## 📊 What You'll See

Once logged in, you'll see all your database tables in the sidebar:

```
📁 Collections (Your Database Tables)
  ├── 👥 users
  ├── 👨‍👩‍👧 families
  ├── 👥 family_members
  ├── 📄 content
  ├── 📁 content_types
  ├── 🏷️ categories
  ├── 🖼️ app_assets
  ├── 📱 app_screens
  ├── 🎨 app_themes
  ├── 🎛️ app_configuration
  ├── 🚩 app_feature_flags
  └── ... (all your other tables)
```

---

## 🎨 Managing App Configuration

### Example: Change Login Background

#### 1. Go to "App Assets" Collection
Click on "app_assets" in the sidebar

#### 2. Find Login Background
Look for the item with `asset_key = "login_background"`

#### 3. Edit the Asset
Click on the row to open the editor

#### 4. Change the Image
- **Option A:** Upload a new file
- **Option B:** Paste a URL to an external image
- **Option C:** Choose from existing uploads

#### 5. Save
Click "Save" button

#### 6. Done!
Your mobile app will use the new background on next launch!

---

## 🔧 Common Tasks

### Task 1: Update Login Screen Configuration

**Steps:**
1. Click "App Screens" in sidebar
2. Find "login_screen"
3. Click to edit
4. Modify the JSON configuration:
```json
{
  "background": {
    "type": "image",
    "image_url": "https://your-cdn.com/new-bg.jpg"
  },
  "title": {
    "text": "Welcome to Bondarys",
    "color": "#FFFFFF"
  }
}
```
5. Click Save

**Result:** Login screen updated instantly!

---

### Task 2: Toggle a Feature Flag

**Steps:**
1. Click "App Feature Flags" in sidebar
2. Find the feature (e.g., "dark_mode")
3. Click to edit
4. Toggle "Is Enabled" switch
5. Adjust "Rollout Percentage" (0-100%)
6. Click Save

**Result:** Feature enabled/disabled for users!

---

### Task 3: Add a New App Asset

**Steps:**
1. Click "App Assets" in sidebar
2. Click "+" button (top right)
3. Fill in the form:
   - **Asset Key:** `home_banner_summer`
   - **Asset Name:** Summer Home Banner
   - **Asset Type:** Select "banner"
   - **Asset URL:** Upload file or paste URL
   - **Platform:** Select "all"
   - **Is Active:** Toggle ON
   - **Priority:** 10
4. Click Save

**Result:** New asset available in your app!

---

### Task 4: Create New Content

**Steps:**
1. Click "Content" in sidebar
2. Click "+" button
3. Fill in the form:
   - **Family:** Select family
   - **Content Type:** Select type
   - **Title:** Your content title
   - **Content:** Write your content
   - **Status:** Select "published"
   - **Featured Image URL:** Upload image
4. Click Save

**Result:** Content appears in mobile app!

---

## 👥 User Management

### Add a New Admin User

**Steps:**
1. Click "User Directory" (person icon in top right)
2. Click "Invite User"
3. Enter email
4. Select role:
   - **Administrator:** Full access
   - **Content Editor:** Can edit content only
   - **Viewer:** Read-only access
5. Send invitation

**User receives email with setup link**

---

### Create Custom Roles

**Steps:**
1. Click "Settings" (gear icon)
2. Go to "Access Control" → "Roles"
3. Click "Create Role"
4. Configure permissions:
   - ✅ Can read app_assets
   - ✅ Can update app_assets
   - ❌ Cannot delete app_assets
   - ✅ Can read users
   - ❌ Cannot edit users
5. Save role

**Result:** Fine-grained access control!

---

## 📁 File & Asset Management

### Upload Multiple Files

**Steps:**
1. Click "File Library" (image icon in sidebar)
2. Click "Upload Files"
3. Drag and drop multiple files
4. Wait for upload to complete
5. Files are now available to use

**Supported Formats:**
- Images: JPG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM, MOV
- Documents: PDF, DOC, XLS
- Other: ZIP, JSON, etc.

---

### Organize Files in Folders

**Steps:**
1. In File Library, click "New Folder"
2. Name it (e.g., "Login Backgrounds")
3. Drag files into folder
4. Use folders to organize assets

---

## 🔍 Search & Filter

### Search Across All Collections

**Steps:**
1. Use search bar at top
2. Type your search query
3. Results show across all collections

---

### Filter Collections

**Steps:**
1. Open any collection (e.g., "App Assets")
2. Click "Filter" button
3. Add filters:
   - **Asset Type** equals "background"
   - **Is Active** equals "true"
   - **Platform** equals "ios"
4. Apply filters

**Result:** Filtered view of data

---

## 🎨 Customizing Directus

### Change Admin UI Language

**Steps:**
1. Click profile icon (top right)
2. Go to "User Settings"
3. Select "Language"
4. Choose your language
5. Save

---

### Set Up Dark Mode

**Steps:**
1. Click profile icon
2. Toggle "Dark Mode"

---

### Customize Collection Display

**Steps:**
1. Open a collection
2. Click layout icon (top right)
3. Choose layout:
   - **Table:** Spreadsheet view
   - **Cards:** Visual cards
   - **Calendar:** Date-based view
   - **Map:** Location-based view
4. Configure columns to display

---

## 🔐 Security Best Practices

### 1. Change Default Password

**Steps:**
1. Click profile icon → "User Settings"
2. Go to "Password"
3. Enter new secure password
4. Save

**Use strong password:** 16+ characters, mixed case, numbers, symbols

---

### 2. Enable 2FA (Two-Factor Authentication)

**Steps:**
1. User Settings → "Security"
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

---

### 3. Restrict IP Access (Production)

Add to `docker-compose.yml`:
```yaml
environment:
  IP_ALLOW_LIST: '192.168.1.0/24,10.0.0.0/8'
```

---

### 4. Use Environment Variables for Secrets

**Never hardcode passwords in docker-compose.yml!**

Create `.env` file:
```bash
DIRECTUS_KEY=your-random-key-here
DIRECTUS_SECRET=your-random-secret-here
DIRECTUS_ADMIN_PASSWORD=your-secure-password
```

Update docker-compose.yml:
```yaml
environment:
  KEY: ${DIRECTUS_KEY}
  SECRET: ${DIRECTUS_SECRET}
  ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
```

---

## 🔄 Webhooks & Automation

### Set Up Webhook

**Use Case:** Clear cache when content changes

**Steps:**
1. Settings → "Webhooks"
2. Click "Create Webhook"
3. Configure:
   - **Name:** Clear App Cache
   - **Method:** POST
   - **URL:** `http://backend:3000/api/cache/clear`
   - **Trigger:** After Update
   - **Collections:** app_assets, app_screens
   - **Status:** Active
4. Save

**Result:** Automatic cache invalidation!

---

## 📊 API Access

### Get Directus API Token

**Steps:**
1. User Settings → "API Tokens"
2. Click "Create Token"
3. Set permissions
4. Copy token (shown once!)

**Use in API calls:**
```bash
curl http://localhost:10008/items/app_assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Access via REST API

**Get all app assets:**
```bash
GET http://localhost:10008/items/app_assets
```

**Get specific asset:**
```bash
GET http://localhost:10008/items/app_assets/[id]
```

**Update asset:**
```bash
PATCH http://localhost:10008/items/app_assets/[id]
Content-Type: application/json

{
  "asset_url": "https://new-url.com/image.jpg",
  "is_active": true
}
```

---

## 🛠️ Troubleshooting

### Issue: Can't Access Directus

**Solution:**
```bash
# Check if container is running
docker-compose ps directus

# Check logs
docker-compose logs directus

# Restart container
docker-compose restart directus
```

---

### Issue: Database Connection Error

**Solution:**
```bash
# Verify Supabase DB is running
docker-compose ps supabase-db

# Test database connection
docker exec -it bondarys-directus ping supabase-db

# Check credentials in docker-compose.yml
```

---

### Issue: Permission Denied

**Solution:**
1. Check your user role
2. Go to Settings → Access Control
3. Verify permissions for your role
4. Contact admin to adjust permissions

---

### Issue: Files Not Uploading

**Solution:**
```bash
# Check upload size limit
# In docker-compose.yml:
MAX_PAYLOAD_SIZE: '100mb'  # Increase if needed

# Check disk space
docker exec -it bondarys-directus df -h

# Check volume permissions
docker-compose down
docker volume rm bondarys_directus_uploads
docker-compose up -d directus
```

---

## 📚 Advanced Features

### 1. Data Model Designer

Visually design your database schema:
1. Settings → "Data Model"
2. Create collections (tables)
3. Add fields
4. Set relationships
5. Apply changes

---

### 2. Flows (Automation)

Create automated workflows:
1. Settings → "Flows"
2. Create flow
3. Add triggers (Schedule, Event, Webhook)
4. Add operations (Send Email, HTTP Request, etc.)
5. Activate flow

**Example:** Send email when new content is published

---

### 3. Insights (Analytics)

Create dashboards:
1. Click "Insights" in sidebar
2. Create dashboard
3. Add panels:
   - Line charts
   - Bar charts
   - Metrics
   - Lists
4. Share with team

---

### 4. Translations

Manage multi-language content:
1. Enable translations for a collection
2. Add translation fields
3. Switch language in UI
4. Edit content in each language

---

## 🎯 Best Practices

### 1. Collection Naming
- Use snake_case: `app_assets` not `appAssets`
- Be descriptive: `user_profile_images` not `images`
- Prefix related: `app_*` for app config tables

### 2. Field Types
- Use correct types (Number, Date, JSON, etc.)
- Set validation rules
- Add descriptions/notes
- Set default values

### 3. Access Control
- Create specific roles (Editor, Viewer, Admin)
- Grant minimum necessary permissions
- Review permissions regularly
- Use field-level permissions

### 4. File Management
- Use folders to organize
- Set naming conventions
- Delete unused files
- Optimize images before upload

### 5. Performance
- Add indexes to frequently queried fields
- Use filters instead of searching entire collections
- Paginate large collections
- Enable caching where appropriate

---

## 🚀 Next Steps

Now that Directus is set up:

1. ✅ **Train your team** on using the admin interface
2. ✅ **Create roles** for different team members
3. ✅ **Upload assets** (backgrounds, logos, etc.)
4. ✅ **Configure screens** (login, splash, onboarding)
5. ✅ **Set up webhooks** for automation
6. ✅ **Test content changes** in mobile app

---

## 📞 Resources

- **Official Docs:** https://docs.directus.io
- **API Reference:** https://docs.directus.io/reference/introduction
- **GitHub:** https://github.com/directus/directus
- **Discord Community:** https://discord.gg/directus
- **Video Tutorials:** https://www.youtube.com/@DirectusVideos

---

**Congratulations! You now have a powerful, visual admin interface for managing your entire app configuration!** 🎉

No more SQL queries or code changes to update content. Everything is just a few clicks away!

