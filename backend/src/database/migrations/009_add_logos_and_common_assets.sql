-- Add Logos and Common Assets
-- For managing logos, icons, onboarding images, and empty states

-- ============================================================================
-- INSERT LOGO ASSETS
-- ============================================================================

-- Primary Logo (Color)
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'logo_primary',
  'Primary Logo (Color)',
  'logo',
  'https://via.placeholder.com/200x200/FA7272/FFFFFF?text=Bondarys',
  'branding',
  'all',
  true,
  100,
  '{"usage": ["header", "footer", "branding"], "dimensions": {"width": 200, "height": 200}}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Logo White (For Dark Backgrounds)
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'logo_white',
  'Logo White (For Dark Backgrounds)',
  'logo',
  'https://via.placeholder.com/200x200/FFFFFF/FA7272?text=Bondarys',
  'branding',
  'all',
  true,
  100,
  '{"usage": ["login", "splash", "dark_header"], "dimensions": {"width": 200, "height": 200}}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Small Logo/Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'logo_small',
  'Small Logo/Icon',
  'icon',
  'https://via.placeholder.com/100x100/FA7272/FFFFFF?text=B',
  'branding',
  'all',
  true,
  90,
  '{"usage": ["navigation", "notification", "small_header"], "dimensions": {"width": 100, "height": 100}}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- INSERT APP ICONS
-- ============================================================================

-- iOS App Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'app_icon_ios',
  'iOS App Icon',
  'icon',
  'https://via.placeholder.com/1024x1024/FA7272/FFFFFF?text=B',
  'branding',
  'ios',
  true,
  100,
  '{"sizes": ["1024x1024", "512x512", "180x180", "120x120", "60x60"], "purpose": "app_icon"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Android App Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'app_icon_android',
  'Android App Icon',
  'icon',
  'https://via.placeholder.com/512x512/FA7272/FFFFFF?text=B',
  'branding',
  'android',
  true,
  100,
  '{"sizes": ["512x512", "192x192", "96x96", "48x48"], "purpose": "app_icon"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- INSERT ONBOARDING IMAGES
-- ============================================================================

-- Onboarding Step 1
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'onboarding_image_1',
  'Onboarding Step 1',
  'image',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
  'onboarding',
  'all',
  true,
  50,
  '{"step": 1, "title": "Connect with Family", "description": "Stay close with your loved ones"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Onboarding Step 2
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'onboarding_image_2',
  'Onboarding Step 2',
  'image',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
  'onboarding',
  'all',
  true,
  50,
  '{"step": 2, "title": "Stay Safe Together", "description": "Keep everyone safe and informed"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Onboarding Step 3
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'onboarding_image_3',
  'Onboarding Step 3',
  'image',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'onboarding',
  'all',
  true,
  50,
  '{"step": 3, "title": "Share Moments", "description": "Create lasting memories together"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- INSERT EMPTY STATE IMAGES
-- ============================================================================

-- Empty State - No Family
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'empty_state_no_family',
  'Empty State - No Family',
  'image',
  'https://via.placeholder.com/400x400/F5F5F5/999999?text=No+Family',
  'empty_state',
  'all',
  true,
  30,
  '{"screen": "family_list", "message": "You havent joined any families yet"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Empty State - No Posts
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'empty_state_no_posts',
  'Empty State - No Posts',
  'image',
  'https://via.placeholder.com/400x400/F5F5F5/999999?text=No+Posts',
  'empty_state',
  'all',
  true,
  30,
  '{"screen": "social_feed", "message": "No posts yet. Be the first to share!"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Empty State - No Messages
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'empty_state_no_messages',
  'Empty State - No Messages',
  'image',
  'https://via.placeholder.com/400x400/F5F5F5/999999?text=No+Messages',
  'empty_state',
  'all',
  true,
  30,
  '{"screen": "chat_list", "message": "No messages yet. Start a conversation!"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET 
  asset_name = EXCLUDED.asset_name,
  asset_url = EXCLUDED.asset_url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- UPDATE SCREEN CONFIGURATIONS TO INCLUDE LOGO REFERENCES
-- ============================================================================

-- Update Login Screen to reference logo asset
UPDATE app_screens 
SET configuration = jsonb_set(
  configuration,
  '{logo}',
  '{"asset_key": "logo_white", "width": 120, "height": 120, "position": "top"}'::jsonb
)
WHERE screen_key = 'login_screen';

-- Update Home Screen to reference logo asset
UPDATE app_screens 
SET configuration = jsonb_set(
  configuration,
  '{header,logo_asset_key}',
  '"logo_small"'::jsonb
)
WHERE screen_key = 'home_screen';

-- Update Splash Screen to reference logo asset
UPDATE app_screens 
SET configuration = jsonb_set(
  configuration,
  '{logo}',
  '{"asset_key": "logo_white", "width": 150, "height": 150, "animation": "fade-in"}'::jsonb
)
WHERE screen_key = 'splash_screen';

-- ============================================================================
-- CREATE VIEW FOR EASY ASSET LOOKUP
-- ============================================================================

CREATE OR REPLACE VIEW v_active_assets AS
SELECT 
  asset_key,
  asset_name,
  asset_type,
  asset_url,
  category,
  platform,
  priority,
  metadata,
  created_at,
  updated_at
FROM app_assets
WHERE is_active = true
ORDER BY priority DESC, created_at DESC;

-- Done!
SELECT 'Logos and common assets added successfully!' as status;

