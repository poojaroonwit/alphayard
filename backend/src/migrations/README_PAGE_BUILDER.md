# Page Builder Migration

This migration creates the database schema for the visual page builder system.

## What's Included

### Tables Created
- **pages** - Main pages table with metadata, SEO config, and publishing info
- **page_components** - Components that make up each page
- **component_definitions** - Reusable component definitions with schemas
- **templates** - Pre-built page templates
- **page_versions** - Version history for pages
- **page_hierarchy** - Page parent-child relationships for navigation
- **publishing_workflows** - Approval workflows for publishing
- **page_audit_log** - Audit trail of all page changes

### Default Data
- **9 Component Definitions**:
  - Layout: Container, Grid, Section
  - Content: Heading, Text, Image
  - Interactive: Button
  - Marketing: Hero, FeatureGrid

- **4 Templates**:
  - Blank - Start from scratch
  - Landing Page - Marketing landing page
  - Blog Post - Simple blog layout
  - Product Page - Product showcase

### Database Functions
- `create_page_version()` - Automatically creates versions on save
- `update_page_hierarchy()` - Maintains hierarchy depth and paths
- `log_page_audit()` - Logs all page changes
- `check_published_url_uniqueness()` - Prevents duplicate URLs
- `auto_publish_scheduled_pages()` - Publishes scheduled pages
- `auto_unpublish_expired_pages()` - Archives expired pages
- `get_page_with_components()` - Retrieves page with all components
- `duplicate_page()` - Duplicates a page with all components

## Running the Migration

### Option 1: Using the migration script (Recommended)

```bash
cd backend
node setup/08-run-page-builder-migration.js
```

### Option 2: Using psql

```bash
psql $DATABASE_URL -f backend/src/migrations/013_page_builder.sql
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `013_page_builder.sql`
4. Paste and run

## Verification

After running the migration, verify the tables were created:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'page%' OR table_name IN ('templates', 'component_definitions');

-- Check component definitions
SELECT name, category FROM component_definitions ORDER BY category, name;

-- Check templates
SELECT name, category FROM templates ORDER BY category, name;
```

## Next Steps

After running the migration:

1. **Backend API**: Implement controllers and routes for page management
2. **Frontend**: Build the page builder interface in the admin console
3. **Testing**: Run property-based tests to verify correctness

## Rollback

If you need to rollback this migration:

```sql
-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS page_audit_log CASCADE;
DROP TABLE IF EXISTS publishing_workflows CASCADE;
DROP TABLE IF EXISTS page_hierarchy CASCADE;
DROP TABLE IF EXISTS page_versions CASCADE;
DROP TABLE IF EXISTS page_components CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS component_definitions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_page_version() CASCADE;
DROP FUNCTION IF EXISTS update_page_hierarchy() CASCADE;
DROP FUNCTION IF EXISTS log_page_audit() CASCADE;
DROP FUNCTION IF EXISTS check_published_url_uniqueness() CASCADE;
DROP FUNCTION IF EXISTS auto_publish_scheduled_pages() CASCADE;
DROP FUNCTION IF EXISTS auto_unpublish_expired_pages() CASCADE;
DROP FUNCTION IF EXISTS get_page_with_components(UUID) CASCADE;
DROP FUNCTION IF EXISTS duplicate_page(UUID, VARCHAR, UUID) CASCADE;
```

## Troubleshooting

### Error: relation "users" does not exist
The migration references a `users` table. Make sure your base migrations have been run first.

### Error: function gen_random_uuid() does not exist
Enable the pgcrypto extension:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: permission denied
Make sure your database user has CREATE TABLE permissions.

## Schema Diagram

```
pages
├── id (PK)
├── title
├── slug (unique)
├── parent_id (FK → pages)
├── template_id (FK → templates)
├── status (draft/scheduled/published/archived)
└── metadata (JSONB)

page_components
├── id (PK)
├── page_id (FK → pages)
├── component_type
├── position
├── props (JSONB)
└── styles (JSONB)

component_definitions
├── id (PK)
├── name (unique)
├── category
├── schema (JSONB)
└── default_props (JSONB)

templates
├── id (PK)
├── name
├── category
└── components (JSONB)

page_versions
├── id (PK)
├── page_id (FK → pages)
├── version_number
└── components (JSONB)
```
