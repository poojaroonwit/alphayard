-- Page Builder Migration
-- This migration creates tables for the visual page builder system

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    template_id UUID,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    seo_config JSONB DEFAULT '{}'
);

-- Page components (junction table)
CREATE TABLE IF NOT EXISTS page_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    component_type VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    props JSONB DEFAULT '{}',
    styles JSONB DEFAULT '{}',
    responsive_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Component definitions
CREATE TABLE IF NOT EXISTS component_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    schema JSONB NOT NULL,
    default_props JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    thumbnail VARCHAR(500),
    components JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page versions
CREATE TABLE IF NOT EXISTS page_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    components JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    change_description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_id, version_number)
);

-- Page hierarchy (for navigation)
CREATE TABLE IF NOT EXISTS page_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    depth INTEGER DEFAULT 0,
    path VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Publishing workflow
CREATE TABLE IF NOT EXISTS publishing_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    requires_approval BOOLEAN DEFAULT false,
    approval_status VARCHAR(50) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS page_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    user_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_published_at ON pages(published_at);
CREATE INDEX IF NOT EXISTS idx_pages_scheduled_for ON pages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_page_components_page_id ON page_components(page_id);
CREATE INDEX IF NOT EXISTS idx_page_components_position ON page_components(page_id, position);
CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_created_at ON page_versions(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_hierarchy_page_id ON page_hierarchy(page_id);
CREATE INDEX IF NOT EXISTS idx_page_hierarchy_parent_id ON page_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_publishing_workflows_page_id ON publishing_workflows(page_id);
CREATE INDEX IF NOT EXISTS idx_page_audit_log_page_id ON page_audit_log(page_id);
CREATE INDEX IF NOT EXISTS idx_page_audit_log_created_at ON page_audit_log(created_at DESC);

-- Insert default component definitions
INSERT INTO component_definitions (name, category, icon, description, schema, default_props, is_system, is_active) VALUES
-- Layout Components
('Container', 'layout', 'square-3-stack-3d', 'Container for content with max-width', 
 '{"properties": {"maxWidth": {"type": "select", "label": "Max Width", "options": [{"label": "Small", "value": "sm"}, {"label": "Medium", "value": "md"}, {"label": "Large", "value": "lg"}, {"label": "Full", "value": "full"}]}, "padding": {"type": "select", "label": "Padding", "options": [{"label": "None", "value": "none"}, {"label": "Small", "value": "sm"}, {"label": "Medium", "value": "md"}, {"label": "Large", "value": "lg"}]}}}',
 '{"maxWidth": "lg", "padding": "md"}', true, true),

('Grid', 'layout', 'squares-2x2', 'Grid layout for arranging content', 
 '{"properties": {"columns": {"type": "number", "label": "Columns", "default": 2, "min": 1, "max": 12}, "gap": {"type": "select", "label": "Gap", "options": [{"label": "Small", "value": "sm"}, {"label": "Medium", "value": "md"}, {"label": "Large", "value": "lg"}]}}}',
 '{"columns": 3, "gap": "md"}', true, true),

('Section', 'layout', 'rectangle-stack', 'Section with background and spacing', 
 '{"properties": {"backgroundColor": {"type": "color", "label": "Background Color"}, "paddingY": {"type": "select", "label": "Vertical Padding", "options": [{"label": "Small", "value": "sm"}, {"label": "Medium", "value": "md"}, {"label": "Large", "value": "lg"}, {"label": "Extra Large", "value": "xl"}]}}}',
 '{"backgroundColor": "#ffffff", "paddingY": "lg"}', true, true),

-- Content Components
('Heading', 'content', 'h1', 'Heading text', 
 '{"properties": {"text": {"type": "string", "label": "Text", "required": true}, "level": {"type": "select", "label": "Level", "options": [{"label": "H1", "value": "h1"}, {"label": "H2", "value": "h2"}, {"label": "H3", "value": "h3"}, {"label": "H4", "value": "h4"}]}, "align": {"type": "select", "label": "Alignment", "options": [{"label": "Left", "value": "left"}, {"label": "Center", "value": "center"}, {"label": "Right", "value": "right"}]}}}',
 '{"text": "Heading", "level": "h2", "align": "left"}', true, true),

('Text', 'content', 'document-text', 'Paragraph text', 
 '{"properties": {"text": {"type": "richtext", "label": "Text", "required": true}, "align": {"type": "select", "label": "Alignment", "options": [{"label": "Left", "value": "left"}, {"label": "Center", "value": "center"}, {"label": "Right", "value": "right"}, {"label": "Justify", "value": "justify"}]}}}',
 '{"text": "<p>Enter your text here...</p>", "align": "left"}', true, true),

('Image', 'content', 'photo', 'Image with caption', 
 '{"properties": {"src": {"type": "image", "label": "Image", "required": true}, "alt": {"type": "string", "label": "Alt Text", "required": true}, "caption": {"type": "string", "label": "Caption"}, "width": {"type": "select", "label": "Width", "options": [{"label": "Small", "value": "sm"}, {"label": "Medium", "value": "md"}, {"label": "Large", "value": "lg"}, {"label": "Full", "value": "full"}]}}}',
 '{"src": "", "alt": "", "caption": "", "width": "full"}', true, true),

-- Interactive Components
('Button', 'interactive', 'cursor-arrow-rays', 'Call-to-action button', 
 '{"properties": {"text": {"type": "string", "label": "Button Text", "required": true}, "url": {"type": "string", "label": "URL"}, "variant": {"type": "select", "label": "Variant", "options": [{"label": "Primary", "value": "primary"}, {"label": "Secondary", "value": "secondary"}, {"label": "Outline", "value": "outline"}]}, "size": {"type": "select", "label": "Size", "options": [{"label": "Small", "value": "sm"}, {"label": "Medium", "value": "md"}, {"label": "Large", "value": "lg"}]}}}',
 '{"text": "Click Me", "url": "#", "variant": "primary", "size": "md"}', true, true),

-- Marketing Components
('Hero', 'marketing', 'star', 'Hero section with heading and CTA', 
 '{"properties": {"heading": {"type": "string", "label": "Heading", "required": true}, "subheading": {"type": "string", "label": "Subheading"}, "backgroundImage": {"type": "image", "label": "Background Image"}, "ctaText": {"type": "string", "label": "CTA Text"}, "ctaUrl": {"type": "string", "label": "CTA URL"}}}',
 '{"heading": "Welcome to Our Site", "subheading": "Discover amazing features", "ctaText": "Get Started", "ctaUrl": "#"}', true, true),

('FeatureGrid', 'marketing', 'squares-plus', 'Grid of features with icons', 
 '{"properties": {"title": {"type": "string", "label": "Title"}, "features": {"type": "array", "label": "Features", "items": {"type": "object", "properties": {"icon": {"type": "string", "label": "Icon"}, "title": {"type": "string", "label": "Title"}, "description": {"type": "string", "label": "Description"}}}}}}',
 '{"title": "Our Features", "features": [{"icon": "⚡", "title": "Fast", "description": "Lightning fast performance"}, {"icon": "🔒", "title": "Secure", "description": "Bank-level security"}, {"icon": "📱", "title": "Mobile", "description": "Works on all devices"}]}', true, true)

ON CONFLICT (name) DO NOTHING;

-- Insert default templates
INSERT INTO templates (name, description, category, thumbnail, components, is_system, is_active) VALUES
('Blank', 'Start from scratch', 'basic', '/templates/blank.png', '[]', true, true),

('Landing Page', 'Marketing landing page with hero and features', 'marketing', '/templates/landing.png', 
 '[{"componentType": "Hero", "position": 0, "props": {"heading": "Welcome to Our Product", "subheading": "The best solution for your needs", "ctaText": "Get Started", "ctaUrl": "/signup"}}, {"componentType": "FeatureGrid", "position": 1, "props": {"title": "Why Choose Us", "features": [{"icon": "⚡", "title": "Fast", "description": "Lightning fast performance"}, {"icon": "🔒", "title": "Secure", "description": "Bank-level security"}, {"icon": "📱", "title": "Mobile", "description": "Works on all devices"}]}}]', 
 true, true),

('Blog Post', 'Simple blog post layout', 'content', '/templates/blog.png', 
 '[{"componentType": "Container", "position": 0, "props": {"maxWidth": "md", "padding": "lg"}, "children": [{"componentType": "Heading", "position": 0, "props": {"text": "Blog Post Title", "level": "h1", "align": "left"}}, {"componentType": "Text", "position": 1, "props": {"text": "<p>Write your blog post content here...</p>", "align": "left"}}]}]', 
 true, true),

('Product Page', 'Product showcase page', 'ecommerce', '/templates/product.png', 
 '[{"componentType": "Grid", "position": 0, "props": {"columns": 2, "gap": "lg"}, "children": [{"componentType": "Image", "position": 0, "props": {"src": "/placeholder-product.jpg", "alt": "Product Image", "width": "full"}}, {"componentType": "Container", "position": 1, "children": [{"componentType": "Heading", "position": 0, "props": {"text": "Product Name", "level": "h1"}}, {"componentType": "Text", "position": 1, "props": {"text": "<p>Product description goes here...</p>"}}, {"componentType": "Button", "position": 2, "props": {"text": "Add to Cart", "variant": "primary", "size": "lg"}}]}]}]', 
 true, true)

ON CONFLICT DO NOTHING;

-- Function to create page version on save
CREATE OR REPLACE FUNCTION create_page_version()
RETURNS TRIGGER AS $$
DECLARE
    v_version_number INTEGER;
    v_components JSONB;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM page_versions
    WHERE page_id = NEW.id;
    
    -- Get current components as JSONB
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'component_type', component_type,
            'position', position,
            'props', props,
            'styles', styles,
            'responsive_config', responsive_config
        ) ORDER BY position
    ) INTO v_components
    FROM page_components
    WHERE page_id = NEW.id;
    
    -- Create version record
    INSERT INTO page_versions (
        page_id,
        version_number,
        components,
        metadata,
        created_by
    ) VALUES (
        NEW.id,
        v_version_number,
        COALESCE(v_components, '[]'::jsonb),
        NEW.metadata,
        NEW.updated_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create version on page update
CREATE TRIGGER trigger_create_page_version
    AFTER UPDATE ON pages
    FOR EACH ROW
    WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
    EXECUTE FUNCTION create_page_version();

-- Function to update page hierarchy
CREATE OR REPLACE FUNCTION update_page_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_depth INTEGER;
    v_parent_path VARCHAR(1000);
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Root level page
        NEW.depth := 0;
        NEW.path := NEW.page_id::TEXT;
    ELSE
        -- Get parent depth and path
        SELECT depth, path INTO v_parent_depth, v_parent_path
        FROM page_hierarchy
        WHERE page_id = NEW.parent_id;
        
        NEW.depth := COALESCE(v_parent_depth, 0) + 1;
        NEW.path := COALESCE(v_parent_path, '') || '/' || NEW.page_id::TEXT;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update hierarchy on insert/update
CREATE TRIGGER trigger_update_page_hierarchy
    BEFORE INSERT OR UPDATE ON page_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_page_hierarchy();

-- Function to log page audit
CREATE OR REPLACE FUNCTION log_page_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO page_audit_log (page_id, action, user_id, changes)
        VALUES (NEW.id, 'create', NEW.created_by, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO page_audit_log (page_id, action, user_id, changes)
        VALUES (NEW.id, 'update', NEW.updated_by, 
                jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO page_audit_log (page_id, action, user_id, changes)
        VALUES (OLD.id, 'delete', OLD.updated_by, row_to_json(OLD)::jsonb);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging
CREATE TRIGGER trigger_log_page_audit
    AFTER INSERT OR UPDATE OR DELETE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION log_page_audit();

-- Function to check URL uniqueness for published pages
CREATE OR REPLACE FUNCTION check_published_url_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' THEN
        IF EXISTS (
            SELECT 1 FROM pages 
            WHERE slug = NEW.slug 
            AND id != NEW.id 
            AND status = 'published'
        ) THEN
            RAISE EXCEPTION 'A published page with this URL already exists';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce URL uniqueness for published pages
CREATE TRIGGER trigger_check_published_url
    BEFORE INSERT OR UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION check_published_url_uniqueness();

-- Function to auto-publish scheduled pages
CREATE OR REPLACE FUNCTION auto_publish_scheduled_pages()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE pages
    SET status = 'published',
        published_at = NOW()
    WHERE status = 'scheduled'
    AND scheduled_for <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW());
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-unpublish expired pages
CREATE OR REPLACE FUNCTION auto_unpublish_expired_pages()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE pages
    SET status = 'archived'
    WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get page with components
CREATE OR REPLACE FUNCTION get_page_with_components(p_page_id UUID)
RETURNS TABLE(
    page_data JSONB,
    components_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        row_to_json(p.*)::jsonb as page_data,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pc.id,
                    'componentType', pc.component_type,
                    'position', pc.position,
                    'props', pc.props,
                    'styles', pc.styles,
                    'responsiveConfig', pc.responsive_config
                ) ORDER BY pc.position
            ) FILTER (WHERE pc.id IS NOT NULL),
            '[]'::jsonb
        ) as components_data
    FROM pages p
    LEFT JOIN page_components pc ON p.id = pc.page_id
    WHERE p.id = p_page_id
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate page
CREATE OR REPLACE FUNCTION duplicate_page(
    p_source_page_id UUID,
    p_new_slug VARCHAR(255),
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_new_page_id UUID;
    v_source_page RECORD;
BEGIN
    -- Get source page
    SELECT * INTO v_source_page FROM pages WHERE id = p_source_page_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source page not found';
    END IF;
    
    -- Create new page
    INSERT INTO pages (
        title,
        slug,
        description,
        parent_id,
        template_id,
        status,
        metadata,
        seo_config,
        created_by,
        updated_by
    ) VALUES (
        v_source_page.title || ' (Copy)',
        p_new_slug,
        v_source_page.description,
        v_source_page.parent_id,
        v_source_page.template_id,
        'draft',
        v_source_page.metadata,
        v_source_page.seo_config,
        p_user_id,
        p_user_id
    ) RETURNING id INTO v_new_page_id;
    
    -- Copy components
    INSERT INTO page_components (
        page_id,
        component_type,
        position,
        props,
        styles,
        responsive_config
    )
    SELECT 
        v_new_page_id,
        component_type,
        position,
        props,
        styles,
        responsive_config
    FROM page_components
    WHERE page_id = p_source_page_id;
    
    RETURN v_new_page_id;
END;
$$ LANGUAGE plpgsql;

