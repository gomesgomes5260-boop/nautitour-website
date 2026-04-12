import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nautitour.com.br' }
    ]
  }
};
export default nextConfig;
