/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are set
 * before building the app. Run this as part of the prebuild process.
 * 
 * Usage:
 *   ts-node scripts/validate-env.ts
 * 
 * Or add to package.json:
 *   "prebuild": "ts-node scripts/validate-env.ts && ..."
 */

// @ts-ignore
global.__DEV__ = process.env.NODE_ENV !== 'production';

import { validateEnvironment } from '../src/config/environment';

const main = () => {
  console.log('🔍 Validating environment variables...\n');

  const validation = validateEnvironment();

  if (!validation.isValid) {
    console.error('❌ Validation failed!\n');
    console.error('Missing required environment variables:');
    validation.missingVars.forEach((varName) => {
      console.error(`  - ${varName}`);
    });
    console.error('\n💡 Please set these variables in your .env file or environment.');
    console.error('   See .env.example for reference.\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set!\n');
  process.exit(0);
};

// Run validation
main();

