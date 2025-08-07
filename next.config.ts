import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shelleefisher.com',
        port: '',
        pathname: '/site/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nyc.cloud.appwrite.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
