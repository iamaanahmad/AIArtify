/**
 * Custom Webpack Configuration for LazAI Build Compatibility
 * 
 * This configuration ensures that binary modules from the alith package
 * are properly handled during both development and production builds.
 */

module.exports = {
  // Handle binary files from native modules
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'ignore-loader',
      },
    ],
  },
  
  // External modules that should not be bundled
  externals: [
    'alith',
    'alith/lib',
    /^@lazai-labs\/alith-.*/,
    /^.*\.node$/,
  ],
  
  // Resolve configuration
  resolve: {
    fallback: {
      // Server-side modules should not be bundled for client
      fs: false,
      net: false,
      dns: false,
      tls: false,
      http2: false,
      'async_hooks': false,
      'fs/promises': false,
      perf_hooks: false,
      // LazAI specific fallbacks
      alith: false,
      'alith/lib': false,
    },
  },
  
  // Ignore specific modules during build
  plugins: [
    new (require('webpack')).IgnorePlugin({
      resourceRegExp: /^alith$/,
    }),
    new (require('webpack')).IgnorePlugin({
      resourceRegExp: /^@lazai-labs\/alith-.*/,
    }),
  ],
};
