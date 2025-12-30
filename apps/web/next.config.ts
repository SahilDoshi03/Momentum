import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Disable image optimization for Render deployment
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  skipProxyUrlNormalize: false,
  experimental: {
    // Disable automatic lockfile patching to avoid package manager conflicts
  },
};

export default nextConfig;
