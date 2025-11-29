// metro.config.js
// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure web platform is properly supported
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

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

module.exports = config;