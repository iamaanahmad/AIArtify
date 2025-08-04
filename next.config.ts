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
  ],
  webpack: (config, { isServer }) => {
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
      };
    }
    return config;
  },
};

export default nextConfig;
