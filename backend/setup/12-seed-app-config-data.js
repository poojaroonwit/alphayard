#!/usr/bin/env node

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load root .env (if present)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch (_) {}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.');
    console.error('Please set these in your .env file');
    process.exit(1);
  }

  console.log('🚀 App Configuration Seed Script');
  console.log('=================================\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Connected to Supabase\n');
    console.log('📋 Seeding app configuration data...\n');

    // 1. Seed app_configuration
    console.log('1️⃣  Seeding app_configuration...');
    const configData = [
      {
        config_key: 'app_name',
        config_value: 'Bondarys',
        description: 'Application name'
      },
      {
        config_key: 'app_version',
        config_value: '1.0.0',
        description: 'Current app version'
      },
      {
        config_key: 'api_timeout',
        config_value: 30000,
        description: 'API request timeout in milliseconds'
      },
      {
        config_key: 'cache_duration',
        config_value: 1800000,
        description: 'Cache duration in milliseconds (30 minutes)'
      },
      {
        config_key: 'app_branding',
        config_value: { primaryColor: '#007AFF', secondaryColor: '#5856D6' },
        description: 'App branding colors'
      }
    ];

    for (const config of configData) {
      const { error } = await supabase
        .from('app_configuration')
        .upsert(config, { onConflict: 'config_key' });
      
      if (error) {
        console.log(`   ⚠️  ${config.config_key}: ${error.message}`);
      } else {
        console.log(`   ✅ ${config.config_key}`);
      }
    }

    // 2. Seed app_screens
    console.log('\n2️⃣  Seeding app_screens...');
    const screenData = [
      {
        screen_key: 'login_screen',
        screen_name: 'Login Screen',
        screen_type: 'login',
        configuration: {
          backgroundType: 'image',
          backgroundAsset: 'login_background',
          logoAsset: 'logo_white',
          showSocialLogin: true,
          socialProviders: ['google', 'apple'],
          showForgotPassword: true,
          showSignUp: true,
          primaryColor: '#007AFF',
          buttonStyle: 'rounded'
        }
      },
      {
        screen_key: 'splash_screen',
        screen_name: 'Splash Screen',
        screen_type: 'splash',
        configuration: {
          backgroundType: 'solid',
          backgroundColor: '#007AFF',
          logoAsset: 'logo_white',
          showLoadingIndicator: true,
          minimumDisplayTime: 2000
        }
      },
      {
        screen_key: 'onboarding_screen',
        screen_name: 'Onboarding Screen',
        screen_type: 'onboarding',
        configuration: {
          slides: [
            {
              title: 'Welcome',
              description: 'Get started with our app',
              imageAsset: 'onboarding_1'
            },
            {
              title: 'Discover',
              description: 'Explore amazing features',
              imageAsset: 'onboarding_2'
            },
            {
              title: 'Connect',
              description: 'Stay connected with friends',
              imageAsset: 'onboarding_3'
            }
          ],
          showSkip: true,
          primaryColor: '#007AFF'
        }
      }
    ];

    for (const screen of screenData) {
      const { error } = await supabase
        .from('app_screens')
        .upsert(screen, { onConflict: 'screen_key' });
      
      if (error) {
        console.log(`   ⚠️  ${screen.screen_key}: ${error.message}`);
      } else {
        console.log(`   ✅ ${screen.screen_key}`);
      }
    }

    // 3. Seed app_themes
    console.log('\n3️⃣  Seeding app_themes...');
    const themeData = [
      {
        theme_key: 'default',
        theme_name: 'Default Theme',
        is_default: true,
        theme_config: {
          colors: {
            primary: '#007AFF',
            secondary: '#5856D6',
            success: '#34C759',
            warning: '#FF9500',
            error: '#FF3B30',
            background: '#FFFFFF',
            surface: '#F2F2F7',
            text: '#000000',
            textSecondary: '#8E8E93'
          },
          fonts: {
            regular: 'System',
            medium: 'System-Medium',
            bold: 'System-Bold',
            light: 'System-Light'
          },
          spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32
          },
          borderRadius: {
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            full: 9999
          }
        }
      }
    ];

    for (const theme of themeData) {
      const { error } = await supabase
        .from('app_themes')
        .upsert(theme, { onConflict: 'theme_key' });
      
      if (error) {
        console.log(`   ⚠️  ${theme.theme_key}: ${error.message}`);
      } else {
        console.log(`   ✅ ${theme.theme_key}`);
      }
    }

    // 4. Seed app_assets
    console.log('\n4️⃣  Seeding app_assets...');
    const assetData = [
      {
        asset_key: 'logo_white',
        asset_name: 'White Logo',
        asset_type: 'logo',
        asset_url: '/assets/logo-white.png',
        platform: 'all',
        category: 'branding',
        metadata: { description: 'White version of app logo' }
      },
      {
        asset_key: 'logo_color',
        asset_name: 'Color Logo',
        asset_type: 'logo',
        asset_url: '/assets/logo-color.png',
        platform: 'all',
        category: 'branding',
        metadata: { description: 'Color version of app logo' }
      },
      {
        asset_key: 'login_background',
        asset_name: 'Login Background',
        asset_type: 'background',
        asset_url: '/assets/login-bg.jpg',
        platform: 'all',
        category: 'backgrounds',
        metadata: { description: 'Default login screen background' }
      },
      {
        asset_key: 'onboarding_1',
        asset_name: 'Onboarding Image 1',
        asset_type: 'image',
        asset_url: '/assets/onboarding-1.png',
        platform: 'all',
        category: 'onboarding',
        metadata: { description: 'First onboarding slide image' }
      },
      {
        asset_key: 'onboarding_2',
        asset_name: 'Onboarding Image 2',
        asset_type: 'image',
        asset_url: '/assets/onboarding-2.png',
        platform: 'all',
        category: 'onboarding',
        metadata: { description: 'Second onboarding slide image' }
      },
      {
        asset_key: 'onboarding_3',
        asset_name: 'Onboarding Image 3',
        asset_type: 'image',
        asset_url: '/assets/onboarding-3.png',
        platform: 'all',
        category: 'onboarding',
        metadata: { description: 'Third onboarding slide image' }
      }
    ];

    for (const asset of assetData) {
      const { error } = await supabase
        .from('app_assets')
        .upsert(asset, { onConflict: 'asset_key' });
      
      if (error) {
        console.log(`   ⚠️  ${asset.asset_key}: ${error.message}`);
      } else {
        console.log(`   ✅ ${asset.asset_key}`);
      }
    }

    // 5. Seed app_feature_flags
    console.log('\n5️⃣  Seeding app_feature_flags...');
    const featureData = [
      {
        feature_key: 'social_login',
        feature_name: 'Social Login',
        description: 'Enable social login (Google, Apple)',
        is_enabled: true,
        rollout_percentage: 100
      },
      {
        feature_key: 'biometric_auth',
        feature_name: 'Biometric Authentication',
        description: 'Enable fingerprint/face ID login',
        is_enabled: true,
        rollout_percentage: 100
      },
      {
        feature_key: 'dark_mode',
        feature_name: 'Dark Mode',
        description: 'Enable dark mode theme',
        is_enabled: false,
        rollout_percentage: 0
      },
      {
        feature_key: 'push_notifications',
        feature_name: 'Push Notifications',
        description: 'Enable push notifications',
        is_enabled: true,
        rollout_percentage: 100
      },
      {
        feature_key: 'analytics',
        feature_name: 'Analytics',
        description: 'Enable analytics tracking',
        is_enabled: true,
        rollout_percentage: 100
      }
    ];

    for (const feature of featureData) {
      const { error } = await supabase
        .from('app_feature_flags')
        .upsert(feature, { onConflict: 'feature_key' });
      
      if (error) {
        console.log(`   ⚠️  ${feature.feature_key}: ${error.message}`);
      } else {
        console.log(`   ✅ ${feature.feature_key}`);
      }
    }

    console.log('\n✅ App Configuration seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 5 app configuration values');
    console.log('   - 3 screen configurations (login, splash, onboarding)');
    console.log('   - 1 default theme');
    console.log('   - 6 default assets');
    console.log('   - 5 feature flags');
    console.log('\n🎉 Your mobile app can now fetch dynamic configuration!');
    console.log('\n💡 Test it:');
    console.log('   curl http://localhost:3000/api/app-config/config');
    console.log('   curl http://localhost:3000/api/app-config/screens/login_screen');
    console.log('   curl http://localhost:3000/api/app-config/assets/logo_white');
    
  } catch (err) {
    console.error(`\n❌ Error seeding data: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

main().catch((e) => { 
  console.error(e); 
  process.exit(1); 
});