import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: [
    '@genkit-ai/ai',
    '@genkit-ai/googleai',
    '@genkit-ai/core',
    'genkit',
    'alith',
    '@lazai-labs/alith-linux-x64-gnu',
    '@lazai-labs/alith-darwin-universal',
    '@lazai-labs/alith-win32-x64-msvc',
  ],
  webpack: (config, { isServer }) => {
    // Handle binary files from alith package
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    // Add IgnorePlugin to completely ignore problematic modules during build
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@lazai-labs\/alith-.*/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.node$/,
        contextRegExp: /alith/,
      })
    );

    // Externalize alith and its dependencies for both server and client
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push(
        'alith',
        'alith/lib',
        /^@lazai-labs\/alith-.*/,
        /^.*\.node$/
      );
    }

    if (!isServer) {
      // Don't bundle server-side modules in the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        http2: false,
        'async_hooks': false,
        'fs/promises': false,
        perf_hooks: false,
        alith: false,
        'alith/lib': false,
      };
    }
    return config;
  },
};

export default nextConfig;
