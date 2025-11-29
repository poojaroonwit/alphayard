const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Ensure proper MIME types for web bundles
  config.devServer = {
    ...config.devServer,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    // Ensure proper content type for JavaScript bundles
    before: function(app) {
      app.use((req, res, next) => {
        if (req.url.includes('.bundle') && req.url.includes('platform=web')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        next();
      });
    }
  };
  
  // Ensure proper module resolution for web
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'react-native$': 'react-native-web'
    }
  };
  
  console.log('Webpack config loaded for environment:', env.mode);
  
  return config;
}; 