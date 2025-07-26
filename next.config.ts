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
    ],
  },
};

export default nextConfig;
