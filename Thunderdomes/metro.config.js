// @ts-check
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro treats CSV files as static assets so they can be bundled.
if (config.resolver && Array.isArray(config.resolver.assetExts)) {
  if (!config.resolver.assetExts.includes('csv')) {
    config.resolver.assetExts.push('csv');
  }
}

module.exports = config;

