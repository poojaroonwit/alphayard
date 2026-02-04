-- Marketing CMS Content Migration
-- This migration adds marketing-specific content types and categories

-- Insert marketing content types
INSERT INTO content_types (name, description, schema) VALUES
('marketing_slide', 'Marketing slides for onboarding/landing pages', '{
  "fields": {
    "title": {"type": "string", "required": true, "maxLength": 100},
    "subtitle": {"type": "string", "required": true, "maxLength": 100},
    "description": {"type": "text", "required": true, "maxLength": 500},
    "icon": {"type": "string", "required": true, "maxLength": 50},
    "gradient": {"type": "array", "required": true, "items": {"type": "string"}},
    "features": {"type": "array", "required": true, "items": {"type": "string"}},
    "slide_order": {"type": "number", "required": true},
    "is_active": {"type": "boolean", "default": true}
  }
}'),
('marketing_hero', 'Hero section content for marketing pages', '{
  "fields": {
    "headline": {"type": "string", "required": true, "maxLength": 200},
    "subheadline": {"type": "string", "required": true, "maxLength": 300},
    "cta_text": {"type": "string", "required": true, "maxLength": 50},
    "cta_action": {"type": "string", "required": true, "maxLength": 50},
    "background_image": {"type": "string", "required": false},
    "background_gradient": {"type": "array", "required": false, "items": {"type": "string"}},
    "is_active": {"type": "boolean", "default": true}
  }
}'),
('marketing_feature', 'Feature highlights for marketing pages', '{
  "fields": {
    "title": {"type": "string", "required": true, "maxLength": 100},
    "description": {"type": "text", "required": true, "maxLength": 300},
    "icon": {"type": "string", "required": true, "maxLength": 50},
    "features": {"type": "array", "required": true, "items": {"type": "string"}},
    "display_order": {"type": "number", "required": true},
    "is_active": {"type": "boolean", "default": true}
  }
}'),
('marketing_testimonial', 'Customer testimonials for marketing', '{
  "fields": {
    "quote": {"type": "text", "required": true, "maxLength": 500},
    "author_name": {"type": "string", "required": true, "maxLength": 100},
    "author_title": {"type": "string", "required": false, "maxLength": 100},
    "author_image": {"type": "string", "required": false},
    "rating": {"type": "number", "required": false, "min": 1, "max": 5},
    "display_order": {"type": "number", "required": true},
    "is_active": {"type": "boolean", "default": true}
  }
}'),
('marketing_faq', 'Frequently asked questions for marketing', '{
  "fields": {
    "question": {"type": "string", "required": true, "maxLength": 200},
    "answer": {"type": "text", "required": true, "maxLength": 1000},
    "category": {"type": "string", "required": false, "maxLength": 50},
    "display_order": {"type": "number", "required": true},
    "is_active": {"type": "boolean", "default": true}
  }
}')
ON CONFLICT (name) DO NOTHING;

-- Ensure unique constraint exists for categories
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_circle_id_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_circle_id_name_key UNIQUE (circle_id, name);

-- Insert marketing categories
INSERT INTO categories (circle_id, name, description, color, icon) VALUES
(NULL, 'Marketing Slides', 'Onboarding and landing page slides', '#FF6B6B', '🎯'),
(NULL, 'Hero Sections', 'Main hero content for marketing pages', '#4ECDC4', '🚀'),
(NULL, 'Features', 'Product feature highlights', '#45B7D1', '⭐'),
(NULL, 'Testimonials', 'Customer testimonials and reviews', '#96CEB4', '💬'),
(NULL, 'FAQ', 'Frequently asked questions', '#FFEAA7', '❓'),
(NULL, 'General Marketing', 'General marketing content', '#DDA0DD', '📢')
ON CONFLICT (circle_id, name) DO NOTHING;

-- Create marketing content table for global marketing content (not family-specific)
CREATE TABLE IF NOT EXISTS marketing_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type_id UUID REFERENCES content_types(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    featured_image_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    priority INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketing content meta table
CREATE TABLE IF NOT EXISTS marketing_content_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES marketing_content(id) ON DELETE CASCADE,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, meta_key)
);

-- Create marketing content files table
CREATE TABLE IF NOT EXISTS marketing_content_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES marketing_content(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default marketing content
INSERT INTO marketing_content (content_type_id, category_id, title, slug, content, status, priority, is_featured, published_at) 
SELECT 
    ct.id,
    cat.id,
    'Stay Connected With Your Family',
    'stay-connected-slide',
    '{"title": "Stay Connected", "subtitle": "With Your Family", "description": "Keep your loved ones close with real-time location sharing, instant messaging, and family updates.", "icon": "home-heart", "gradient": ["#FA7272", "#FFBBB4"], "features": ["Real-time location tracking", "Instant family messaging", "Safety alerts & notifications"], "slide_order": 1}',
    'published',
    1,
    true,
    NOW()
FROM content_types ct, categories cat 
WHERE ct.name = 'marketing_slide' AND cat.name = 'Marketing Slides'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marketing_content (content_type_id, category_id, title, slug, content, status, priority, is_featured, published_at) 
SELECT 
    ct.id,
    cat.id,
    'Safety First Always Protected',
    'safety-first-slide',
    '{"title": "Safety First", "subtitle": "Always Protected", "description": "Emergency alerts, geofencing, and safety features to ensure your family''s security and peace of mind.", "icon": "shield-check", "gradient": ["#FA7272", "#FFBBB4"], "features": ["Emergency panic button", "Geofence alerts", "Inactivity monitoring"], "slide_order": 2}',
    'published',
    2,
    true,
    NOW()
FROM content_types ct, categories cat 
WHERE ct.name = 'marketing_slide' AND cat.name = 'Marketing Slides'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marketing_content (content_type_id, category_id, title, slug, content, status, priority, is_featured, published_at) 
SELECT 
    ct.id,
    cat.id,
    'Share Moments Create Memories',
    'share-moments-slide',
    '{"title": "Share Moments", "subtitle": "Create Memories", "description": "Share photos, videos, and memories with your family in a secure, private environment.", "icon": "camera-plus", "gradient": ["#FA7272", "#FFBBB4"], "features": ["Family photo gallery", "Secure file sharing", "Memory timeline"], "slide_order": 3}',
    'published',
    3,
    true,
    NOW()
FROM content_types ct, categories cat 
WHERE ct.name = 'marketing_slide' AND cat.name = 'Marketing Slides'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marketing_content (content_type_id, category_id, title, slug, content, status, priority, is_featured, published_at) 
SELECT 
    ct.id,
    cat.id,
    'Organize Life Together',
    'organize-life-slide',
    '{"title": "Organize Life", "subtitle": "Together", "description": "Manage family schedules, tasks, and events with shared calendars and to-do lists.", "icon": "calendar-check", "gradient": ["#FA7272", "#FFBBB4"], "features": ["Shared family calendar", "Task management", "Event planning"], "slide_order": 4}',
    'published',
    4,
    true,
    NOW()
FROM content_types ct, categories cat 
WHERE ct.name = 'marketing_slide' AND cat.name = 'Marketing Slides'
ON CONFLICT (slug) DO NOTHING;
