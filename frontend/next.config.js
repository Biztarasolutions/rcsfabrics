/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Images are served pre-sized via Supabase's Cloudflare CDN (supabaseImg helper)
    // and Unsplash's own CDN (?w=N&q=80 params). No need for Next.js to re-optimize.
    unoptimized: true,
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
