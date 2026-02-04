-- Migration: Enrich entity_types with UI metadata
-- Description: Adds columns for frontend display and seeds initial system collections.

-- 1. Add metadata columns to entity_types
ALTER TABLE entity_types 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(255),
ADD COLUMN IF NOT EXISTS columns JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS can_create BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_update BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS search_placeholder VARCHAR(255);

-- 2. Seed/Update system collections from hardcoded config
-- We use name as the unique identifier for system collections

-- Circles
INSERT INTO entity_types (name, title, display_name, description, icon, category, api_endpoint, search_placeholder, can_create, can_update, can_delete, columns, schema, is_system)
VALUES (
    'circles', 
    'Circles', 
    'Circle',
    'Manage family circles and groups', 
    'circle', 
    'Social', 
    '/admin/families', 
    'Search circles...', 
    true, true, true,
    '[
        {"id": "name", "label": "Name", "accessor": "name"},
        {"id": "type", "label": "Type", "accessor": "type"},
        {"id": "members", "label": "Members", "accessor": "member_count"},
        {"id": "status", "label": "Status", "accessor": "is_active"},
        {"id": "created_at", "label": "Created At", "accessor": "created_at"}
    ]'::jsonb,
    '[
        {"key": "name", "label": "Circle Name", "type": "text", "required": true, "placeholder": "e.g. Smith Family"},
        {"key": "description", "label": "Description", "type": "text", "placeholder": "Brief description of the circle"},
        {
            "key": "type", 
            "label": "Type", 
            "type": "select", 
            "required": true, 
            "options": [
                {"label": "Family Circle", "value": "Circle"},
                {"label": "Friends Group", "value": "friends"},
                {"label": "Sharehouse", "value": "sharehouse"}
            ],
            "defaultValue": "Circle"
        }
    ]'::jsonb,
    true
)
ON CONFLICT (name) DO UPDATE SET 
    title = EXCLUDED.title,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    api_endpoint = EXCLUDED.api_endpoint,
    search_placeholder = EXCLUDED.search_placeholder,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    columns = EXCLUDED.columns,
    schema = EXCLUDED.schema,
    is_system = true,
    updated_at = NOW();

-- Circle Types
INSERT INTO entity_types (name, title, display_name, description, icon, category, api_endpoint, search_placeholder, can_create, can_update, can_delete, columns, schema, is_system)
VALUES (
    'circle-types', 
    'Circle Types', 
    'Circle Type',
    'Manage types of circles (e.g. Family, Friends)', 
    'collection', 
    'Settings', 
    '/admin/circle-types', 
    'Search types...', 
    true, true, true,
    '[
        {"id": "name", "label": "Name", "accessor": "name"},
        {"id": "code", "label": "Code", "accessor": "code"},
        {"id": "description", "label": "Description", "accessor": "description"},
        {"id": "is_active", "label": "Status", "accessor": "is_active"}
    ]'::jsonb,
    '[
        {"key": "name", "label": "Type Name", "type": "text", "required": true},
        {"key": "code", "label": "Code", "type": "text", "required": true},
        {"key": "description", "label": "Description", "type": "text"},
        {"key": "is_active", "label": "Active", "type": "boolean", "defaultValue": true}
    ]'::jsonb,
    true
)
ON CONFLICT (name) DO UPDATE SET 
    title = EXCLUDED.title,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    api_endpoint = EXCLUDED.api_endpoint,
    search_placeholder = EXCLUDED.search_placeholder,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    columns = EXCLUDED.columns,
    schema = EXCLUDED.schema,
    is_system = true,
    updated_at = NOW();

-- Social Posts
INSERT INTO entity_types (name, title, display_name, description, icon, category, api_endpoint, search_placeholder, can_create, can_update, can_delete, columns, schema, is_system)
VALUES (
    'social-posts', 
    'Social Posts', 
    'Social Post',
    'Manage user content and posts', 
    'chat', 
    'Social', 
    '/admin/social-posts', 
    'Search posts...', 
    false, false, true,
    '[
        {"id": "content", "label": "Content", "accessor": "content", "width": "40%"},
        {"id": "author", "label": "Author", "accessor": "author_name"},
        {"id": "likes", "label": "Likes", "accessor": "like_count"},
        {"id": "created_at", "label": "Posted At", "accessor": "created_at"}
    ]'::jsonb,
    '[]'::jsonb,
    true
)
ON CONFLICT (name) DO UPDATE SET 
    title = EXCLUDED.title,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    api_endpoint = EXCLUDED.api_endpoint,
    search_placeholder = EXCLUDED.search_placeholder,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    columns = EXCLUDED.columns,
    schema = EXCLUDED.schema,
    is_system = true,
    updated_at = NOW();

-- Users
INSERT INTO entity_types (name, title, display_name, description, icon, category, api_endpoint, search_placeholder, can_create, can_update, can_delete, columns, schema, is_system)
VALUES (
    'users', 
    'Users', 
    'User',
    'Manage mobile application users', 
    'user', 
    'System', 
    '/admin/users', 
    'Search users by name or email...', 
    false, true, true,
    '[
        {"id": "name", "label": "Name", "accessor": "first_name"},
        {"id": "email", "label": "Email", "accessor": "email"},
        {"id": "role", "label": "Role", "accessor": "metadata.role"},
        {"id": "status", "label": "Status", "accessor": "is_active"},
        {"id": "created_at", "label": "Joined", "accessor": "created_at"}
    ]'::jsonb,
    '[
        {"key": "firstName", "label": "First Name", "type": "text"},
        {"key": "lastName", "label": "Last Name", "type": "text"},
        {"key": "email", "label": "Email", "type": "text", "required": true},
        {"key": "is_active", "label": "Active Status", "type": "boolean", "defaultValue": true},
        {
            "key": "status", 
            "label": "Status Label", 
            "type": "select", 
            "options": [
                {"label": "Active", "value": "active"}, 
                {"label": "Suspended", "value": "suspended"},
                {"label": "Inactive", "value": "inactive"}
            ] 
        },
        {"key": "metadata", "label": "Metadata (JSON)", "type": "json"}
    ]'::jsonb,
    true
)
ON CONFLICT (name) DO UPDATE SET 
    title = EXCLUDED.title,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    api_endpoint = EXCLUDED.api_endpoint,
    search_placeholder = EXCLUDED.search_placeholder,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    columns = EXCLUDED.columns,
    schema = EXCLUDED.schema,
    is_system = true,
    updated_at = NOW();
