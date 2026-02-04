-- seed.sql
-- Baseline data for the Bondarys App

-- 1. Create default user
-- Password is 'password123' (hashed)
INSERT INTO users (id, email, first_name, last_name, is_active, is_onboarding_complete)
VALUES ('f739edde-45f8-4aa9-82c8-c1876f434683', 'test@example.com', 'Test', 'User', true, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create default application
INSERT INTO applications (name, slug, description, branding, settings, is_active)
VALUES (
    'Bondary', 
    'bondary', 
    'Main Bondary mobile and web application', 
    '{
        "primaryColor": "#FA7272",
        "secondaryColor": "#FFD700",
        "logoUrl": "/assets/logo.png"
    }', 
    '{
        "allowRegistration": true
    }', 
    true
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Global App Settings
INSERT INTO app_settings (key, value, description)
VALUES 
('branding', '{"appName": "Bondarys", "primaryColor": "#FA7272", "secondaryColor": "#FFD700"}', 'Global app branding'),
('maintenance_mode', 'false', 'System maintenance status')
ON CONFLICT (key) DO NOTHING;

-- 4. Initial Circle (Unified Entity)
INSERT INTO unified_entities (id, type, owner_id, status, data)
VALUES (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'circle',
    'f739edde-45f8-4aa9-82c8-c1876f434683',
    'active',
    '{"name": "General Circle", "description": "Default family circle"}'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Membership Relation
INSERT INTO entity_relations (source_id, target_id, relation_type, metadata)
VALUES (
    'f739edde-45f8-4aa9-82c8-c1876f434683',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'member_of',
    '{"role": "owner"}'
)
ON CONFLICT DO NOTHING;
