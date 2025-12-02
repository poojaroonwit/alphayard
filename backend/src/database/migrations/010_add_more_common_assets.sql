-- Add More Common Assets
-- Profile avatars, status illustrations, loading images, icons, banners, tutorials

-- ============================================================================
-- PROFILE & AVATAR ASSETS
-- ============================================================================

-- Default Avatar (Male)
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'avatar_default_male',
  'Default Avatar - Male',
  'image',
  'https://ui-avatars.com/api/?name=User&background=FA7272&color=fff&size=200',
  'profile',
  'all',
  true,
  80,
  '{"usage": ["profile", "fallback"], "gender": "male"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Default Avatar (Female)
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'avatar_default_female',
  'Default Avatar - Female',
  'image',
  'https://ui-avatars.com/api/?name=User&background=FA7272&color=fff&size=200',
  'profile',
  'all',
  true,
  80,
  '{"usage": ["profile", "fallback"], "gender": "female"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Default Avatar (Neutral)
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'avatar_default',
  'Default Avatar - Neutral',
  'image',
  'https://ui-avatars.com/api/?name=User&background=FA7272&color=fff&size=200&rounded=true',
  'profile',
  'all',
  true,
  90,
  '{"usage": ["profile", "fallback", "default"], "type": "neutral"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- STATUS & FEEDBACK ILLUSTRATIONS
-- ============================================================================

-- Success Illustration
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'illustration_success',
  'Success Illustration',
  'image',
  'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=Success!',
  'status',
  'all',
  true,
  70,
  '{"usage": ["success_screen", "confirmation"], "emotion": "positive"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Error Illustration
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'illustration_error',
  'Error Illustration',
  'image',
  'https://via.placeholder.com/300x300/F44336/FFFFFF?text=Oops!',
  'status',
  'all',
  true,
  70,
  '{"usage": ["error_screen", "failure"], "emotion": "negative"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Warning Illustration
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'illustration_warning',
  'Warning Illustration',
  'image',
  'https://via.placeholder.com/300x300/FF9800/FFFFFF?text=Warning',
  'status',
  'all',
  true,
  70,
  '{"usage": ["warning_screen", "caution"], "emotion": "neutral"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Info Illustration
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'illustration_info',
  'Info Illustration',
  'image',
  'https://via.placeholder.com/300x300/2196F3/FFFFFF?text=Info',
  'status',
  'all',
  true,
  70,
  '{"usage": ["info_screen", "help"], "emotion": "neutral"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- LOADING & ANIMATION ASSETS
-- ============================================================================

-- Loading Spinner Image
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'loading_spinner',
  'Loading Spinner',
  'animation',
  'https://via.placeholder.com/100x100/FA7272/FFFFFF?text=Loading',
  'loading',
  'all',
  true,
  60,
  '{"usage": ["loading_screen", "async_operations"], "type": "spinner"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Loading Screen Background
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'loading_background',
  'Loading Screen Background',
  'background',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1080&q=80',
  'loading',
  'all',
  true,
  60,
  '{"usage": ["loading_screen"], "style": "modern"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- PAYMENT & BILLING ICONS
-- ============================================================================

-- Credit Card Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_credit_card',
  'Credit Card Icon',
  'icon',
  'https://via.placeholder.com/64x64/FA7272/FFFFFF?text=CC',
  'payment',
  'all',
  true,
  50,
  '{"usage": ["payment", "billing"], "type": "credit_card"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- PayPal Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_paypal',
  'PayPal Icon',
  'icon',
  'https://via.placeholder.com/64x64/0070BA/FFFFFF?text=PP',
  'payment',
  'all',
  true,
  50,
  '{"usage": ["payment", "billing"], "type": "paypal"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Apple Pay Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_apple_pay',
  'Apple Pay Icon',
  'icon',
  'https://via.placeholder.com/64x64/000000/FFFFFF?text=AP',
  'payment',
  'ios',
  true,
  50,
  '{"usage": ["payment"], "type": "apple_pay"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Google Pay Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_google_pay',
  'Google Pay Icon',
  'icon',
  'https://via.placeholder.com/64x64/4285F4/FFFFFF?text=GP',
  'payment',
  'android',
  true,
  50,
  '{"usage": ["payment"], "type": "google_pay"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- SOCIAL MEDIA ICONS
-- ============================================================================

-- Facebook Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_facebook',
  'Facebook Icon',
  'icon',
  'https://via.placeholder.com/64x64/1877F2/FFFFFF?text=f',
  'social',
  'all',
  true,
  40,
  '{"usage": ["social_login", "sharing"], "platform": "facebook"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Google Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_google',
  'Google Icon',
  'icon',
  'https://via.placeholder.com/64x64/FFFFFF/4285F4?text=G',
  'social',
  'all',
  true,
  40,
  '{"usage": ["social_login"], "platform": "google"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Apple Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_apple',
  'Apple Icon',
  'icon',
  'https://via.placeholder.com/64x64/000000/FFFFFF?text=A',
  'social',
  'ios',
  true,
  40,
  '{"usage": ["social_login"], "platform": "apple"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Twitter Icon
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'icon_twitter',
  'Twitter Icon',
  'icon',
  'https://via.placeholder.com/64x64/1DA1F2/FFFFFF?text=T',
  'social',
  'all',
  true,
  40,
  '{"usage": ["sharing"], "platform": "twitter"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- TUTORIAL & HELP IMAGES
-- ============================================================================

-- Tutorial Step 1
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'tutorial_navigation',
  'Tutorial - Navigation',
  'image',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
  'tutorial',
  'all',
  true,
  30,
  '{"step": 1, "title": "Navigate the App", "description": "Learn how to use our navigation"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Tutorial Step 2
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'tutorial_features',
  'Tutorial - Key Features',
  'image',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'tutorial',
  'all',
  true,
  30,
  '{"step": 2, "title": "Discover Features", "description": "Explore all the amazing features"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Help Center Image
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'help_center',
  'Help Center Image',
  'image',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'tutorial',
  'all',
  true,
  30,
  '{"usage": ["help_screen", "support"], "type": "help"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- PROMOTIONAL BANNERS
-- ============================================================================

-- Home Banner 1
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'banner_home_promo',
  'Home Promotional Banner',
  'banner',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1080&q=80',
  'promotional',
  'all',
  true,
  20,
  '{"position": "home_top", "link": "/promo", "valid_until": "2025-12-31"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Feature Announcement Banner
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'banner_new_feature',
  'New Feature Announcement Banner',
  'banner',
  'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1080&q=80',
  'promotional',
  'all',
  true,
  20,
  '{"position": "announcement", "type": "feature", "dismissible": true}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Sale/Discount Banner
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'banner_sale',
  'Sale/Discount Banner',
  'banner',
  'https://via.placeholder.com/1080x300/FF5722/FFFFFF?text=Special+Offer!',
  'promotional',
  'all',
  false,
  20,
  '{"position": "top", "type": "sale", "discount": "20%"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- MISCELLANEOUS COMMON ASSETS
-- ============================================================================

-- Maintenance Mode Image
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'maintenance_mode',
  'Maintenance Mode Illustration',
  'image',
  'https://via.placeholder.com/400x400/FF9800/FFFFFF?text=Under+Maintenance',
  'system',
  'all',
  true,
  10,
  '{"usage": ["maintenance_screen"], "type": "maintenance"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- No Internet Connection Image
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'no_internet',
  'No Internet Connection Illustration',
  'image',
  'https://via.placeholder.com/400x400/9E9E9E/FFFFFF?text=No+Connection',
  'system',
  'all',
  true,
  10,
  '{"usage": ["offline_screen"], "type": "offline"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Coming Soon Image
INSERT INTO app_assets (asset_key, asset_name, asset_type, asset_url, category, platform, is_active, priority, metadata)
VALUES (
  'coming_soon',
  'Coming Soon Illustration',
  'image',
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
  'system',
  'all',
  true,
  10,
  '{"usage": ["placeholder_screen"], "type": "coming_soon"}'::jsonb
)
ON CONFLICT (asset_key) DO UPDATE 
SET asset_name = EXCLUDED.asset_name, asset_url = EXCLUDED.asset_url, metadata = EXCLUDED.metadata, updated_at = NOW();

-- ============================================================================
-- UPDATE ASSET COUNTS
-- ============================================================================

-- Done!
SELECT 
  'More common assets added successfully!' as status,
  COUNT(*) as total_assets,
  COUNT(*) FILTER (WHERE is_active = true) as active_assets
FROM app_assets;

