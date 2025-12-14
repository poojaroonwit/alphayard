-- ============================================================================
-- App Configuration Migration
-- Similar to Adobe Experience Manager (AEM) for mobile apps
-- Manages dynamic app configuration, themes, screens, assets, and feature flags
-- ============================================================================

-- ============================================================================
-- 1. App Configuration Table
-- Stores key-value configuration for the app
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_app_configuration_key ON app_configuration(config_key);
CREATE INDEX idx_app_configuration_active ON app_configuration(is_active);

-- ============================================================================
-- 2. App Screens Table
-- Stores screen-specific configuration (login, splash, onboarding, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_key VARCHAR(255) UNIQUE NOT NULL,
  screen_name VARCHAR(255) NOT NULL,
  screen_type VARCHAR(50) NOT NULL CHECK (screen_type IN ('splash', 'login', 'onboarding', 'home', 'settings', 'profile', 'custom')),
  configuration JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_app_screens_key ON app_screens(screen_key);
CREATE INDEX idx_app_screens_type ON app_screens(screen_type);
CREATE INDEX idx_app_screens_active ON app_screens(is_active);

-- ============================================================================
-- 3. App Themes Table
-- Stores theme configurations (colors, fonts, spacing, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_key VARCHAR(255) UNIQUE NOT NULL,
  theme_name VARCHAR(255) NOT NULL,
  theme_config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_app_themes_key ON app_themes(theme_key);
CREATE INDEX idx_app_themes_default ON app_themes(is_default);
CREATE INDEX idx_app_themes_active ON app_themes(is_active);

-- ============================================================================
-- 4. App Assets Table
-- Stores asset information (images, videos, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_key VARCHAR(255) UNIQUE NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'document', 'background', 'icon', 'logo')),
  asset_url TEXT NOT NULL,
  platform VARCHAR(20) DEFAULT 'all' CHECK (platform IN ('all', 'ios', 'android', 'web')),
  category VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  dimensions JSONB,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_app_assets_key ON app_assets(asset_key);
CREATE INDEX idx_app_assets_type ON app_assets(asset_type);
CREATE INDEX idx_app_assets_platform ON app_assets(platform);
CREATE INDEX idx_app_assets_category ON app_assets(category);
CREATE INDEX idx_app_assets_active ON app_assets(is_active);

-- ============================================================================
-- 5. App Feature Flags Table
-- Stores feature flags for A/B testing and gradual rollouts
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key VARCHAR(255) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_app_feature_flags_key ON app_feature_flags(feature_key);
CREATE INDEX idx_app_feature_flags_enabled ON app_feature_flags(is_enabled);

-- ============================================================================
-- 6. Insert Default Data
-- ============================================================================

-- Default app configuration
INSERT INTO app_configuration (config_key, config_value, description) VALUES
('app_name', '"MyApp"', 'Application name'),
('app_version', '"1.0.0"', 'Current app version'),
('api_timeout', '30000', 'API request timeout in milliseconds'),
('cache_duration', '1800000', 'Cache duration in milliseconds (30 minutes)'),
('app_branding', '{"primaryColor": "#007AFF", "secondaryColor": "#5856D6"}', 'App branding colors')
ON CONFLICT (config_key) DO NOTHING;

-- Default login screen configuration
INSERT INTO app_screens (screen_key, screen_name, screen_type, configuration) VALUES
('login_screen', 'Login Screen', 'login', '{
  "backgroundType": "image",
  "backgroundAsset": "login_background",
  "logoAsset": "logo_white",
  "showSocialLogin": true,
  "socialProviders": ["google", "apple"],
  "showForgotPassword": true,
  "showSignUp": true,
  "primaryColor": "#007AFF",
  "buttonStyle": "rounded"
}'),
('splash_screen', 'Splash Screen', 'splash', '{
  "backgroundType": "solid",
  "backgroundColor": "#007AFF",
  "logoAsset": "logo_white",
  "showLoadingIndicator": true,
  "minimumDisplayTime": 2000
}'),
('onboarding_screen', 'Onboarding Screen', 'onboarding', '{
  "slides": [
    {
      "title": "Welcome",
      "description": "Get started with our app",
      "imageAsset": "onboarding_1"
    },
    {
      "title": "Discover",
      "description": "Explore amazing features",
      "imageAsset": "onboarding_2"
    },
    {
      "title": "Connect",
      "description": "Stay connected with friends",
      "imageAsset": "onboarding_3"
    }
  ],
  "showSkip": true,
  "primaryColor": "#007AFF"
}')
ON CONFLICT (screen_key) DO NOTHING;

-- Default theme
INSERT INTO app_themes (theme_key, theme_name, theme_config, is_default) VALUES
('default', 'Default Theme', '{
  "colors": {
    "primary": "#007AFF",
    "secondary": "#5856D6",
    "success": "#34C759",
    "warning": "#FF9500",
    "error": "#FF3B30",
    "background": "#FFFFFF",
    "surface": "#F2F2F7",
    "text": "#000000",
    "textSecondary": "#8E8E93"
  },
  "fonts": {
    "regular": "System",
    "medium": "System-Medium",
    "bold": "System-Bold",
    "light": "System-Light"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  },
  "borderRadius": {
    "sm": 4,
    "md": 8,
    "lg": 12,
    "xl": 16,
    "full": 9999
  }
}', true)
ON CONFLICT (theme_key) DO NOTHING;

-- Default assets (placeholders)
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, platform, category, metadata) VALUES
('logo_white', 'White Logo', 'logo', '/assets/logo-white.png', 'all', 'branding', '{"description": "White version of app logo"}'),
('logo_color', 'Color Logo', 'logo', '/assets/logo-color.png', 'all', 'branding', '{"description": "Color version of app logo"}'),
('login_background', 'Login Background', 'background', '/assets/login-bg.jpg', 'all', 'backgrounds', '{"description": "Default login screen background"}'),
('onboarding_1', 'Onboarding Image 1', 'image', '/assets/onboarding-1.png', 'all', 'onboarding', '{"description": "First onboarding slide image"}'),
('onboarding_2', 'Onboarding Image 2', 'image', '/assets/onboarding-2.png', 'all', 'onboarding', '{"description": "Second onboarding slide image"}'),
('onboarding_3', 'Onboarding Image 3', 'image', '/assets/onboarding-3.png', 'all', 'onboarding', '{"description": "Third onboarding slide image"}')
ON CONFLICT (asset_key) DO NOTHING;

-- Default feature flags
INSERT INTO app_feature_flags (feature_key, feature_name, description, is_enabled, rollout_percentage) VALUES
('social_login', 'Social Login', 'Enable social login (Google, Apple)', true, 100),
('biometric_auth', 'Biometric Authentication', 'Enable fingerprint/face ID login', true, 100),
('dark_mode', 'Dark Mode', 'Enable dark mode theme', false, 0),
('push_notifications', 'Push Notifications', 'Enable push notifications', true, 100),
('analytics', 'Analytics', 'Enable analytics tracking', true, 100)
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feature_flags ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (app needs to read config)
CREATE POLICY "Public read access" ON app_configuration FOR SELECT USING (true);
CREATE POLICY "Public read access" ON app_screens FOR SELECT USING (true);
CREATE POLICY "Public read access" ON app_themes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON app_assets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON app_feature_flags FOR SELECT USING (true);

-- Admin write access (authenticated users can modify)
-- Note: In production, you should restrict this to admin users only
CREATE POLICY "Authenticated users can insert" ON app_configuration FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update" ON app_configuration FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON app_configuration FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert" ON app_screens FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update" ON app_screens FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON app_screens FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert" ON app_themes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update" ON app_themes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON app_themes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert" ON app_assets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update" ON app_assets FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON app_assets FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert" ON app_feature_flags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update" ON app_feature_flags FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON app_feature_flags FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 8. Updated At Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_configuration_updated_at BEFORE UPDATE ON app_configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_screens_updated_at BEFORE UPDATE ON app_screens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_themes_updated_at BEFORE UPDATE ON app_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_assets_updated_at BEFORE UPDATE ON app_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_feature_flags_updated_at BEFORE UPDATE ON app_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
