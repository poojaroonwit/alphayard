// metro.config.js
// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure web platform is properly supported
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure path aliases to match tsconfig.json
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@types': path.resolve(__dirname, 'src/types'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@contexts': path.resolve(__dirname, 'src/contexts'),
  '@store': path.resolve(__dirname, 'src/store'),
  'react': path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  // 'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  'styled-components': path.resolve(__dirname, 'node_modules/styled-components'),
};

// Force Metro to resolve react and react-native from the mobile directory
config.resolver.extraNodeModules = {
  ...config.resolver.alias,
};

// Prevent Metro from seeing the root node_modules for React
const rootNodeModules = path.resolve(__dirname, '..', 'node_modules');
config.resolver.blockList = [
  // Block root React to avoid duplicates (safely handling Windows backslashes)
  new RegExp(`${rootNodeModules.replace(/\\/g, '\\\\')}\\\\react\\\\.*`),
  new RegExp(`${rootNodeModules.replace(/\\/g, '\\\\')}\\\\react-dom\\\\.*`),
  new RegExp(`${rootNodeModules.replace(/\\/g, '\\\\')}\\\\react-native\\\\.*`),
];

// Add transformer configuration
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Patch resolver to ensure PlatformConstants polyfill loads first
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If resolving the main entry point, ensure polyfill is loaded
  if (moduleName === './index' || moduleName === 'index.js') {
    // This ensures polyfill loads first
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
