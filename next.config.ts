import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.180', 'localhost'],
  images: {
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
  },
};

const SentryConfig = withSentryConfig(nextConfig, {
  org: "jace-xt",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});

export default SentryConfig;
