-- Admin RBAC Migration
-- Creates admin_users and admin_roles tables for Role-Based Access Control

-- Admin Roles Table (create first as admin_users references it)
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (handles existing table)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Insert default roles
INSERT INTO admin_roles (name, description, permissions) VALUES
    ('super_admin', 'Full system access - can manage everything', '["*"]'),
    ('editor', 'Can manage pages and assets', '["pages:read", "pages:write", "pages:delete", "pages:publish", "assets:read", "assets:write", "assets:delete"]'),
    ('viewer', 'Read-only access to pages and assets', '["pages:read", "assets:read"]')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Insert default super admin user
-- Password: admin123 (bcrypt hash with 10 rounds)
-- Generated via: require('bcrypt').hashSync('admin123', 10)
INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
SELECT 
    'admin@bondarys.com',
    '$2b$10$rOzJqQZP.kP8KqMqMqMqMuQH3YJ5KzrD0ZzFdP5Z5Z5Z5Z5Z5Z',
    'Super',
    'Admin',
    r.id
FROM admin_roles r
WHERE r.name = 'super_admin'
ON CONFLICT (email) DO NOTHING;
