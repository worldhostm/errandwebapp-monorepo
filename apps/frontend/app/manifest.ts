import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '부름이 - 주변 심부름으로 부수입 벌기',
    short_name: '부름이',
    description: '부름이는 주변의 간단한 심부름을 수행하며 부수입을 얻을 수 있는 위치기반 플랫폼입니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0066cc',
    orientation: 'portrait',
    scope: '/',
    lang: 'ko',
    categories: ['business', 'productivity', 'lifestyle'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}