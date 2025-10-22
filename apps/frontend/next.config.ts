import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 메모리 최적화: 이미지 최적화 비활성화 (개발 시)
  images: {
    unoptimized: true,
  },

  // 메모리 최적화: 출력 파일 추적 최소화
  outputFileTracingRoot: undefined,

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
