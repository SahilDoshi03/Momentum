import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
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
  skipMiddlewareUrlNormalize: false,
  experimental: {
    // Disable automatic lockfile patching to avoid package manager conflicts
  },
};

export default nextConfig;
