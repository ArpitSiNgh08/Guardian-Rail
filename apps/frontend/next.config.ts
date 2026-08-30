import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'isomorphic-ws': './src/midnight/isomorphic-ws-shim.ts',
    },
  },
};

export default nextConfig;
