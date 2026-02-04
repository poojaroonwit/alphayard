-- CMS Content Management System Migration
-- This migration creates all necessary tables for the CMS system

-- Content Types Table
CREATE TABLE IF NOT EXISTS content_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#FFD700',
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    content_type_id UUID REFERENCES content_types(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(circle_id, slug)
);

-- Content Meta Table
CREATE TABLE IF NOT EXISTS content_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, meta_key)
);

-- Content Tags Table
CREATE TABLE IF NOT EXISTS content_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, tag)
);

-- Content Interactions Table
CREATE TABLE IF NOT EXISTS content_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'view', 'share', 'comment')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, user_id, interaction_type)
);

-- Content Comments Table
CREATE TABLE IF NOT EXISTS content_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Analytics Table
CREATE TABLE IF NOT EXISTS content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, date)
);

-- Content Files Table
CREATE TABLE IF NOT EXISTS content_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default content types
INSERT INTO content_types (name, description, schema) VALUES
('family_news', 'Family news and updates', '{"fields": ["content", "author", "date"]}'),
('family_events', 'Family events and celebrations', '{"fields": ["event_date", "location", "description"]}'),
('family_memories', 'Photos and stories from family life', '{"fields": ["story", "date", "location"]}'),
('safety_alerts', 'Important safety information and alerts', '{"fields": ["alert_type", "severity", "message"]}'),
('family_recipes', 'Favorite family recipes and cooking tips', '{"fields": ["ingredients", "instructions", "prep_time", "cook_time"]}'),
('family_tips', 'Helpful tips and advice for family life', '{"fields": ["category", "tip_content"]}')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (circle_id, name, description, color, icon) VALUES
(NULL, 'General', 'General family content', '#FFD700', '📁'),
(NULL, 'News', 'Family news and updates', '#2196F3', '📰'),
(NULL, 'Events', 'Family events and celebrations', '#4CAF50', '🎉'),
(NULL, 'Memories', 'Family photos and memories', '#FF9800', '📸'),
(NULL, 'Safety', 'Safety alerts and information', '#F44336', '🚨'),
(NULL, 'Recipes', 'Family recipes and cooking', '#9C27B0', '👨‍🍳'),
(NULL, 'Tips', 'Helpful family tips', '#607D8B', '💡')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_circle_id ON content(circle_id);
CREATE INDEX IF NOT EXISTS idx_content_type_id ON content(content_type_id);
CREATE INDEX IF NOT EXISTS idx_content_category_id ON content(category_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON content(published_at);
CREATE INDEX IF NOT EXISTS idx_content_created_by ON content(created_by);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content_id ON content_interactions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user_id ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON content_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON content_analytics(date);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_types_updated_at ON content_types;
CREATE TRIGGER update_content_types_updated_at BEFORE UPDATE ON content_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_comments_updated_at ON content_comments;
CREATE TRIGGER update_content_comments_updated_at BEFORE UPDATE ON content_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_files ENABLE ROW LEVEL SECURITY;

-- Content Types policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Content types are viewable by authenticated users" ON content_types;
CREATE POLICY "Content types are viewable by authenticated users" ON content_types FOR SELECT USING (auth.role() = 'authenticated');

-- Categories policies
DROP POLICY IF EXISTS "Categories are viewable by family members" ON categories;
CREATE POLICY "Categories are viewable by family members" ON categories FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM circle_members fm 
        WHERE fm.circle_id = categories.circle_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Categories are manageable by family admins" ON categories;
CREATE POLICY "Categories are manageable by family admins" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM circle_members fm 
        WHERE fm.circle_id = categories.circle_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'parent')
    )
);

-- Content policies
DROP POLICY IF EXISTS "Content is viewable by family members" ON content;
CREATE POLICY "Content is viewable by family members" ON content FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM circle_members fm 
        WHERE fm.circle_id = content.circle_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Content is manageable by family admins" ON content;
CREATE POLICY "Content is manageable by family admins" ON content FOR ALL USING (
    EXISTS (
        SELECT 1 FROM circle_members fm 
        WHERE fm.circle_id = content.circle_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'parent')
    )
);

-- Content Meta policies
DROP POLICY IF EXISTS "Content meta is viewable by family members" ON content_meta;
CREATE POLICY "Content meta is viewable by family members" ON content_meta FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_meta.content_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Content meta is manageable by family admins" ON content_meta;
CREATE POLICY "Content meta is manageable by family admins" ON content_meta FOR ALL USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_meta.content_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'parent')
    )
);

-- Content Tags policies
DROP POLICY IF EXISTS "Content tags are viewable by family members" ON content_tags;
CREATE POLICY "Content tags are viewable by family members" ON content_tags FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_tags.content_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Content tags are manageable by family admins" ON content_tags;
CREATE POLICY "Content tags are manageable by family admins" ON content_tags FOR ALL USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_tags.content_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'parent')
    )
);

-- Content Interactions policies
DROP POLICY IF EXISTS "Content interactions are viewable by family members" ON content_interactions;
CREATE POLICY "Content interactions are viewable by family members" ON content_interactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_interactions.content_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can manage their own interactions" ON content_interactions;
CREATE POLICY "Users can manage their own interactions" ON content_interactions FOR ALL USING (
    user_id = auth.uid()
);

-- Content Comments policies
DROP POLICY IF EXISTS "Content comments are viewable by family members" ON content_comments;
CREATE POLICY "Content comments are viewable by family members" ON content_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_comments.content_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can manage their own comments" ON content_comments;
CREATE POLICY "Users can manage their own comments" ON content_comments FOR ALL USING (
    user_id = auth.uid()
);

-- Content Analytics policies
DROP POLICY IF EXISTS "Content analytics are viewable by family admins" ON content_analytics;
CREATE POLICY "Content analytics are viewable by family admins" ON content_analytics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_analytics.content_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'parent')
    )
);

-- Content Files policies
DROP POLICY IF EXISTS "Content files are viewable by family members" ON content_files;
CREATE POLICY "Content files are viewable by family members" ON content_files FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_files.content_id 
        AND fm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Content files are manageable by family admins" ON content_files;
CREATE POLICY "Content files are manageable by family admins" ON content_files FOR ALL USING (
    EXISTS (
        SELECT 1 FROM content c
        JOIN circle_members fm ON fm.circle_id = c.circle_id
        WHERE c.id = content_files.content_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'parent')
    )
);
