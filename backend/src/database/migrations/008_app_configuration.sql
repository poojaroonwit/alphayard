-- App Configuration Management System
-- This migration creates tables for managing dynamic app content like backgrounds, themes, etc.
-- Similar to Adobe Experience Manager (AEM) for mobile apps

-- ============================================================================
-- APP CONFIGURATION TABLE
-- ============================================================================
-- Stores global app configuration (themes, branding, feature flags, etc.)
CREATE TABLE IF NOT EXISTS app_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('theme', 'branding', 'feature', 'content', 'settings')),
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP SCREENS TABLE
-- ============================================================================
-- Manages screen-level configuration (login, splash, onboarding, etc.)
CREATE TABLE IF NOT EXISTS app_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_key VARCHAR(100) NOT NULL UNIQUE,
    screen_name VARCHAR(100) NOT NULL,
    screen_type VARCHAR(50) NOT NULL CHECK (screen_type IN ('splash', 'login', 'onboarding', 'home', 'settings', 'profile', 'custom')),
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP ASSETS TABLE
-- ============================================================================
-- Manages dynamic assets (backgrounds, logos, icons, videos, etc.)
CREATE TABLE IF NOT EXISTS app_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_key VARCHAR(100) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('image', 'video', 'logo', 'icon', 'background', 'banner', 'animation')),
    asset_url TEXT NOT NULL,
    asset_size INTEGER, -- in bytes
    asset_mime_type VARCHAR(100),
    dimensions JSONB, -- {width: 1920, height: 1080}
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
    tags TEXT[], -- Array of tags for easy filtering
    category VARCHAR(50),
    platform VARCHAR(20) CHECK (platform IN ('all', 'ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP THEMES TABLE
-- ============================================================================
-- Stores theme configurations (colors, fonts, styles)
CREATE TABLE IF NOT EXISTS app_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_key VARCHAR(100) NOT NULL UNIQUE,
    theme_name VARCHAR(100) NOT NULL,
    theme_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    preview_image_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP FEATURE FLAGS TABLE
-- ============================================================================
-- Controls feature availability dynamically
CREATE TABLE IF NOT EXISTS app_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    feature_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_platforms TEXT[], -- ['ios', 'android', 'web']
    target_versions TEXT[], -- ['>=1.0.0', '<2.0.0']
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP LOCALIZATION TABLE
-- ============================================================================
-- Extended localization for app strings (complements existing translation tables)
CREATE TABLE IF NOT EXISTS app_localization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locale VARCHAR(10) NOT NULL,
    namespace VARCHAR(100) NOT NULL,
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(locale, namespace, key)
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
CREATE INDEX IF NOT EXISTS idx_app_localization_locale ON app_localization(locale);
CREATE INDEX IF NOT EXISTS idx_app_localization_namespace ON app_localization(namespace);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================
CREATE TRIGGER update_app_configuration_updated_at BEFORE UPDATE ON app_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_screens_updated_at BEFORE UPDATE ON app_screens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_assets_updated_at BEFORE UPDATE ON app_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_themes_updated_at BEFORE UPDATE ON app_themes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_feature_flags_updated_at BEFORE UPDATE ON app_feature_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_localization_updated_at BEFORE UPDATE ON app_localization 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    "image_url": null,
    "video_url": null,
    "overlay_opacity": 0.9
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
  "social_login": {
    "enabled": true,
    "providers": ["google", "facebook", "apple"]
  },
  "form_style": {
    "background_color": "rgba(255, 255, 255, 0.95)",
    "border_radius": 16,
    "padding": 24
  }
}', true)
ON CONFLICT (screen_key) DO NOTHING;

-- Splash Screen Configuration
INSERT INTO app_screens (screen_key, screen_name, screen_type, configuration, is_active) VALUES
('splash_screen', 'Splash Screen', 'splash', '{
  "background": {
    "type": "gradient",
    "gradient": ["#FA7272", "#FFBBB4"],
    "image_url": null,
    "animation_url": null
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
  "duration_ms": 2000,
  "show_loading_indicator": true
}', true)
ON CONFLICT (screen_key) DO NOTHING;

-- Onboarding Screen Configuration
INSERT INTO app_screens (screen_key, screen_name, screen_type, configuration, is_active) VALUES
('onboarding_screen', 'Onboarding Screens', 'onboarding', '{
  "slides": [
    {
      "id": 1,
      "title": "Stay Connected",
      "subtitle": "With Your Family",
      "description": "Keep your loved ones close with real-time location sharing, instant messaging, and family updates.",
      "icon": "home-heart",
      "gradient": ["#FA7272", "#FFBBB4"],
      "image_url": null
    },
    {
      "id": 2,
      "title": "Safety First",
      "subtitle": "Always Protected",
      "description": "Emergency alerts, geofencing, and safety features to ensure your familys security.",
      "icon": "shield-check",
      "gradient": ["#FA7272", "#FFBBB4"],
      "image_url": null
    },
    {
      "id": 3,
      "title": "Share Moments",
      "subtitle": "Create Memories",
      "description": "Share photos, videos, and memories with your family in a secure environment.",
      "icon": "camera-plus",
      "gradient": ["#FA7272", "#FFBBB4"],
      "image_url": null
    }
  ],
  "skip_enabled": true,
  "auto_advance": false,
  "show_indicator": true
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
  "logo_white_url": "/assets/logo-white.png",
  "favicon_url": "/assets/favicon.ico"
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
}', 'Feature availability flags', 'feature', true),

('app_limits', '{
  "max_family_members": 20,
  "max_file_size_mb": 50,
  "max_video_duration_minutes": 10,
  "max_photos_per_upload": 10
}', 'App usage limits', 'settings', true),

('maintenance_mode', '{
  "enabled": false,
  "message": "We are performing scheduled maintenance. Please check back soon.",
  "estimated_completion": null
}', 'Maintenance mode configuration', 'settings', true)
ON CONFLICT (config_key) DO NOTHING;

-- Default Feature Flags
INSERT INTO app_feature_flags (feature_key, feature_name, description, is_enabled, rollout_percentage, target_platforms) VALUES
('new_chat_ui', 'New Chat Interface', 'Updated chat interface with improved UX', false, 0, ARRAY['ios', 'android']),
('video_filters', 'Video Filters', 'AR filters for video calls', false, 0, ARRAY['ios', 'android']),
('dark_mode', 'Dark Mode', 'Dark theme support', true, 100, ARRAY['ios', 'android', 'web']),
('ai_safety_alerts', 'AI Safety Alerts', 'AI-powered safety alert suggestions', false, 10, ARRAY['ios', 'android'])
ON CONFLICT (feature_key) DO NOTHING;

-- Default Assets
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority) VALUES
('login_background', 'Login Background', 'background', '/assets/backgrounds/login-bg.jpg', 'authentication', 'all', true, 10),
('splash_background', 'Splash Background', 'background', '/assets/backgrounds/splash-bg.jpg', 'splash', 'all', true, 10),
('home_banner', 'Home Banner', 'banner', '/assets/banners/home-banner.jpg', 'home', 'all', true, 5),
('app_logo', 'App Logo', 'logo', '/assets/logo.png', 'branding', 'all', true, 100),
('app_icon', 'App Icon', 'icon', '/assets/icon.png', 'branding', 'all', true, 100)
ON CONFLICT (asset_key) DO NOTHING;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_localization ENABLE ROW LEVEL SECURITY;

-- Public read access for all active configuration
CREATE POLICY "App configuration is viewable by all" ON app_configuration FOR SELECT USING (is_active = true);
CREATE POLICY "App screens are viewable by all" ON app_screens FOR SELECT USING (is_active = true);
CREATE POLICY "App assets are viewable by all" ON app_assets FOR SELECT USING (is_active = true);
CREATE POLICY "App themes are viewable by all" ON app_themes FOR SELECT USING (is_active = true);
CREATE POLICY "App feature flags are viewable by authenticated users" ON app_feature_flags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "App localization is viewable by all" ON app_localization FOR SELECT USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Only admins can modify app configuration" ON app_configuration FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can modify app screens" ON app_screens FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can modify app assets" ON app_assets FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can modify app themes" ON app_themes FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can modify feature flags" ON app_feature_flags FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can modify localization" ON app_localization FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

