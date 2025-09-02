import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/kakao/:path*',
        destination: 'https://dapi.kakao.com/:path*'
      }
    ]
  }
};

export default nextConfig;
