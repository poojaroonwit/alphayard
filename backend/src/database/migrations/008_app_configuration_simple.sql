-- Simple App Configuration Tables (No foreign key dependencies)
-- For managing dynamic app content like backgrounds, themes, etc.

-- ============================================================================
-- APP CONFIGURATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('theme', 'branding', 'feature', 'content', 'settings')),
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP SCREENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_key VARCHAR(100) NOT NULL UNIQUE,
    screen_name VARCHAR(100) NOT NULL,
    screen_type VARCHAR(50) NOT NULL CHECK (screen_type IN ('splash', 'login', 'onboarding', 'home', 'settings', 'profile', 'custom')),
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_key VARCHAR(100) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('image', 'video', 'logo', 'icon', 'background', 'banner', 'animation')),
    asset_url TEXT NOT NULL,
    asset_size INTEGER,
    asset_mime_type VARCHAR(100),
    dimensions JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    category VARCHAR(50),
    platform VARCHAR(20) CHECK (platform IN ('all', 'ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP THEMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_key VARCHAR(100) NOT NULL UNIQUE,
    theme_name VARCHAR(100) NOT NULL,
    theme_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    preview_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP FEATURE FLAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    feature_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_platforms TEXT[],
    target_versions TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_configuration(category);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_configuration(is_active);
CREATE INDEX IF NOT EXISTS idx_app_screens_type ON app_screens(screen_type);
CREATE INDEX IF NOT EXISTS idx_app_screens_active ON app_screens(is_active);
CREATE INDEX IF NOT EXISTS idx_app_assets_type ON app_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_app_assets_active ON app_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_app_assets_platform ON app_assets(platform);
CREATE INDEX IF NOT EXISTS idx_app_assets_tags ON app_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_app_themes_active ON app_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_app_themes_default ON app_themes(is_default);
CREATE INDEX IF NOT EXISTS idx_app_feature_flags_enabled ON app_feature_flags(is_enabled);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Default Theme
INSERT INTO app_themes (theme_key, theme_name, theme_config, is_default, is_active) VALUES
('default', 'Default Theme', '{
  "colors": {
    "primary": "#FA7272",
    "secondary": "#FFD700",
    "background": "#FFFFFF",
    "surface": "#F5F5F5",
    "text": "#333333",
    "textSecondary": "#666666",
    "border": "#E0E0E0",
    "success": "#4CAF50",
    "warning": "#FF9800",
    "error": "#F44336",
    "info": "#2196F3"
  },
  "fonts": {
    "regular": "SF Pro Text",
    "medium": "SF Pro Text Medium",
    "semibold": "SF Pro Text Semibold",
    "bold": "SF Pro Display Bold"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32,
    "xxl": 48
  },
  "borderRadius": {
    "sm": 4,
    "md": 8,
    "lg": 12,
    "xl": 16,
    "round": 9999
  }
}', true, true)
ON CONFLICT (theme_key) DO NOTHING;

-- Login Screen Configuration
INSERT INTO app_screens (screen_key, screen_name, screen_type, configuration, is_active) VALUES
('login_screen', 'Login Screen', 'login', '{
  "background": {
    "type": "gradient",
    "gradient": ["#FA7272", "#FFBBB4"],
    "image_url": "https://images.unsplash.com/photo-1557683316-973673baf926?w=1080&q=80",
    "overlay_opacity": 0.7
  },
  "logo": {
    "url": "/assets/logo-white.png",
    "width": 120,
    "height": 120,
    "position": "top"
  },
  "title": {
    "text": "Welcome Back",
    "font_size": 32,
    "color": "#FFFFFF",
    "font_weight": "bold"
  },
  "subtitle": {
    "text": "Sign in to continue to Bondarys",
    "font_size": 16,
    "color": "#FFFFFF",
    "font_weight": "normal"
  },
  "form_style": {
    "background_color": "rgba(255, 255, 255, 0.95)",
    "border_radius": 16,
    "padding": 24
  }
}', true)
ON CONFLICT (screen_key) DO NOTHING;

-- Home Screen Configuration
INSERT INTO app_screens (screen_key, screen_name, screen_type, configuration, is_active) VALUES
('home_screen', 'Home Screen', 'home', '{
  "background": {
    "type": "gradient",
    "gradient": ["#FFFFFF", "#F5F5F5"],
    "image_url": null
  },
  "header": {
    "background_color": "#FA7272",
    "text_color": "#FFFFFF",
    "show_avatar": true
  },
  "banner": {
    "enabled": true,
    "image_url": "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1080&q=80",
    "height": 200
  },
  "sections": {
    "quick_actions": true,
    "recent_activity": true,
    "family_feed": true
  }
}', true)
ON CONFLICT (screen_key) DO NOTHING;

-- Splash Screen Configuration
INSERT INTO app_screens (screen_key, screen_name, screen_type, configuration, is_active) VALUES
('splash_screen', 'Splash Screen', 'splash', '{
  "background": {
    "type": "gradient",
    "gradient": ["#FA7272", "#FFBBB4"]
  },
  "logo": {
    "url": "/assets/logo-white.png",
    "width": 150,
    "height": 150,
    "animation": "fade-in"
  },
  "tagline": {
    "text": "Connecting families, building communities",
    "font_size": 18,
    "color": "#FFFFFF",
    "animation": "fade-in-up"
  },
  "duration_ms": 2000
}', true)
ON CONFLICT (screen_key) DO NOTHING;

-- Default App Configuration
INSERT INTO app_configuration (config_key, config_value, description, category, is_active) VALUES
('app_branding', '{
  "app_name": "Bondarys",
  "tagline": "Connecting families, building communities",
  "primary_color": "#FA7272",
  "secondary_color": "#FFD700",
  "logo_url": "/assets/logo.png",
  "logo_white_url": "/assets/logo-white.png"
}', 'App branding configuration', 'branding', true),

('app_features', '{
  "location_tracking": true,
  "messaging": true,
  "video_calls": true,
  "file_sharing": true,
  "calendar": true,
  "tasks": true,
  "budget": true,
  "safety_alerts": true
}', 'Feature availability flags', 'feature', true)
ON CONFLICT (config_key) DO NOTHING;

-- Default Feature Flags
INSERT INTO app_feature_flags (feature_key, feature_name, description, is_enabled, rollout_percentage, target_platforms) VALUES
('dark_mode', 'Dark Mode', 'Dark theme support', true, 100, ARRAY['ios', 'android', 'web']),
('dynamic_backgrounds', 'Dynamic Backgrounds', 'Load backgrounds from CMS', true, 100, ARRAY['ios', 'android'])
ON CONFLICT (feature_key) DO NOTHING;

-- Default Assets
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority) VALUES
('login_background', 'Login Background', 'background', 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1080&q=80', 'authentication', 'all', true, 10),
('home_background', 'Home Background', 'background', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1080&q=80', 'home', 'all', true, 10),
('splash_background', 'Splash Background', 'background', 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1080&q=80', 'splash', 'all', true, 10),
('app_logo', 'App Logo', 'logo', '/assets/logo.png', 'branding', 'all', true, 100),
('app_icon', 'App Icon', 'icon', '/assets/icon.png', 'branding', 'all', true, 100)
ON CONFLICT (asset_key) DO NOTHING;

-- Done!
SELECT 'App configuration tables created and seeded successfully!' as status;

