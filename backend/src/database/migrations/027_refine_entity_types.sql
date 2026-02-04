-- Migration: Refine entity_types with response keys and add missing collections
-- Description: Adds response_key and searchable columns, and seeds note/todo types.

-- 1. Add missing columns
ALTER TABLE entity_types 
ADD COLUMN IF NOT EXISTS response_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT true;

-- 2. Update existing system collections with correct response keys
UPDATE entity_types SET response_key = 'families' WHERE name = 'circles';
UPDATE entity_types SET response_key = 'users' WHERE name = 'users';
UPDATE entity_types SET response_key = 'posts' WHERE name = 'social-posts';
UPDATE entity_types SET response_key = 'types' WHERE name = 'circle-types';

-- 3. Seed/Update missing collections (Notes, Todos, etc.)

-- Notes
INSERT INTO entity_types (name, title, display_name, description, icon, category, api_endpoint, response_key, search_placeholder, can_create, can_update, can_delete, columns, schema, is_system)
VALUES (
    'note', 
    'Notes', 
    'Note',
    'User notes and memos', 
    'file-text', 
    'Content', 
    '/mobile/collections/note', 
    'items',
    'Search notes...', 
    true, true, true,
    '[
        {"id": "title", "label": "Title", "accessor": "title"},
        {"id": "content", "label": "Content", "accessor": "content"},
        {"id": "created_at", "label": "Created At", "accessor": "createdAt"}
    ]'::jsonb,
    '[
        {"key": "title", "label": "Title", "type": "text", "required": true},
        {"key": "content", "label": "Content", "type": "text", "required": true}
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
    response_key = EXCLUDED.response_key,
    search_placeholder = EXCLUDED.search_placeholder,
    columns = EXCLUDED.columns,
    schema = EXCLUDED.schema,
    is_system = true,
    updated_at = NOW();

-- Todos
INSERT INTO entity_types (name, title, display_name, description, icon, category, api_endpoint, response_key, search_placeholder, can_create, can_update, can_delete, columns, schema, is_system)
VALUES (
    'todo', 
    'Todos', 
    'Todo',
    'Tasks and to-do items', 
    'check-square', 
    'Content', 
    '/mobile/collections/todo', 
    'items',
    'Search tasks...', 
    true, true, true,
    '[
        {"id": "title", "label": "Task", "accessor": "title"},
        {"id": "status", "label": "Status", "accessor": "status"},
        {"id": "created_at", "label": "Created At", "accessor": "createdAt"}
    ]'::jsonb,
    '[
        {"key": "title", "label": "Task Name", "type": "text", "required": true},
        {"key": "status", "label": "Status", "type": "select", "options": [{"label": "Pending", "value": "active"}, {"label": "Done", "value": "completed"}]}
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
    response_key = EXCLUDED.response_key,
    search_placeholder = EXCLUDED.search_placeholder,
    columns = EXCLUDED.columns,
    schema = EXCLUDED.schema,
    is_system = true,
    updated_at = NOW();
