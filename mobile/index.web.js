// CRITICAL: Polyfills and error handlers must load before anything else
import './src/utils/platformConstantsPolyfill';
// Suppress non-critical Jimp errors (especially in web bundling)
import './src/utils/jimpErrorHandler';
import './src/utils/webPolyfills';

import { AppRegistry } from 'react-native';
import App from './App';
// import App from './src/TestApp';

// Register the main component
AppRegistry.registerComponent('main', () => App);

// Run the application
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root')
});