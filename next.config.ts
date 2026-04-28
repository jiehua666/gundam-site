import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.180', 'localhost'],

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/banners/**',
      },
      {
        protocol: 'https',
        hostname: 'pic3.zhimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.zhimg.com',
      },
      {
        protocol: 'https',
        hostname: 'p1.itc.cn',
      },
      {
        protocol: 'https',
        hostname: 'p3.itc.cn',
      },
      {
        protocol: 'https',
        hostname: 'staticcdn.bandaihobbysite.cn',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/banners/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

const SentryConfig = withSentryConfig(nextConfig, {
  org: "jace-xt",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});

export default SentryConfig;
