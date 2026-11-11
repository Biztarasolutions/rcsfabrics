import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RCS Fabrics',
    short_name: 'RCS Fabrics',
    description: 'Premium fabrics by the metre — a family fabric business since 1970.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf6eb',
    theme_color: '#6b1219',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
