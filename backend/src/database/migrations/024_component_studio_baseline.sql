-- Component Studio Baseline
-- This migration creates tables for managing UI components and their style variants.

-- 1. Component Categories Table
CREATE TABLE IF NOT EXISTS component_categories (
    id VARCHAR(50) PRIMARY KEY, -- human-readable slug e.g. 'buttons', 'cards', 'inputs'
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Component Styles Table
CREATE TABLE IF NOT EXISTS component_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) REFERENCES component_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    definition_id VARCHAR(100), -- Link to code implementation e.g. 'ThemedButton'
    styles JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    mobile_config JSONB DEFAULT '{}', -- Added to store mobile-specific info like filePath
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Triggers for updated_at
DROP TRIGGER IF EXISTS update_component_categories_updated_at ON component_categories;
CREATE TRIGGER update_component_categories_updated_at BEFORE UPDATE ON component_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_component_styles_updated_at ON component_styles;
CREATE TRIGGER update_component_styles_updated_at BEFORE UPDATE ON component_styles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Initial Baseline Seed Data (Categorized)
INSERT INTO component_categories (id, name, icon, description, position) VALUES
('buttons', 'Buttons', 'buttons', 'Configure interaction elements.', 10),
('cards', 'Cards', 'cards', 'Define content wrappers.', 20),
('inputs', 'Inputs', 'inputs', 'Text fields & form elements.', 30),
('layout', 'Layout', 'layout', 'Structure & Containers.', 40),
('feedback', 'Feedback', 'feedback', 'Toasts & Modals.', 50),
('mobile-nav', 'Mobile Navigation', 'mobile-nav', 'Tab bars, drawers, and menus.', 60),
('mobile-actions', 'Mobile Actions', 'mobile-actions', 'Floating buttons and quick actions.', 70),
('data-display', 'Data Display', 'data-display', 'Charts, stats, and visualizers.', 80),
('status-feedback', 'Status & Feedback', 'status-feedback', 'Indicators and progress.', 90),
('advanced-inputs', 'Advanced Inputs', 'advanced-inputs', 'Sliders, toggles, chips.', 100),
('lists-grids', 'Lists & Grids', 'lists-grids', 'Advanced data repeaters.', 110),
('communication', 'Communication UI', 'communication', 'Chat bubbles, inputs, and status.', 120),
('media-assets', 'Media & Assets', 'media-assets', 'Avatars, images, and galleries.', 130),
('safety-ui', 'Safety & SOS', 'safety-ui', 'Emergency controls and alerts.', 140),
('charts-data', 'Charts & Analytics', 'charts-data', 'Heatmaps, bar charts, and data viz.', 150),
('app-widgets', 'Dashboard Widgets', 'app-widgets', 'HomeScreen overview components.', 160),
('navigation-ui', 'Navigation UI', 'navigation-ui', 'Tab bars, drawers, and menus.', 170)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    position = EXCLUDED.position;
