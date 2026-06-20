// Warm-beige 1×1 SVG — shown instantly while the real image loads
export const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IGZpbGw9IiNlOGU0ZGUiLz48L3N2Zz4=';

/**
 * Transform a Supabase Storage public URL into a Supabase Image Transform URL.
 * These are served via Cloudflare CDN and come back as WebP at the requested size —
 * no Netlify serverless function involved, no double-optimization.
 *
 * Non-Supabase URLs (Unsplash, placeholders, etc.) are returned unchanged.
 */
export function supabaseImg(url: string, width: number, quality = 75): string {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) return url;
  const [base, path] = url.split('/storage/v1/object/public/');
  // Strip any existing query string from the path before adding our own
  const cleanPath = path?.split('?')[0] ?? '';
  return `${base}/storage/v1/render/image/public/${cleanPath}?width=${width}&quality=${quality}&format=webp`;
}
