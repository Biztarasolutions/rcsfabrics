// Warm-beige 1×1 SVG — shown instantly while the real image loads
export const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IGZpbGw9IiNlOGU0ZGUiLz48L3N2Zz4=';

const SUPABASE_PUBLIC = '/storage/v1/object/public/';
const SUPABASE_RENDER = '/storage/v1/render/image/public/';

// Set NEXT_PUBLIC_IMAGE_CDN=netlify (see netlify.toml) to resize through Netlify Image CDN.
// Anywhere else (local dev, other hosts) the original Supabase file is used.
const USE_NETLIFY_CDN = process.env.NEXT_PUBLIC_IMAGE_CDN === 'netlify';

/**
 * Return a displayable, right-sized URL for a Supabase Storage image.
 *
 * Supabase's own /render/image transform is a paid feature and returns
 * 403 "FeatureNotEnabled" on this project, so we never use it. On Netlify we
 * resize + convert to WebP through Netlify Image CDN (free on all plans; the
 * Supabase host is allow-listed in netlify.toml). Otherwise the plain public
 * object URL is returned.
 *
 * Non-Supabase URLs (Unsplash, placeholders, etc.) are returned unchanged.
 */
export function supabaseImg(
  url: string,
  width: number,
  quality = 75,
  resize: 'contain' | 'cover' | 'fill' = 'contain'
): string {
  if (!url || !url.includes('supabase.co/storage/v1/')) return url;

  // Normalise to the public object URL (also repairs any stored /render/image URLs)
  const publicUrl = url.replace(SUPABASE_RENDER, SUPABASE_PUBLIC).split('?')[0];
  if (!publicUrl.includes(SUPABASE_PUBLIC)) return url;

  if (!USE_NETLIFY_CDN) return publicUrl;

  const params = new URLSearchParams({
    url: publicUrl,
    w: String(width),
    q: String(quality),
    fm: 'webp',
    fit: resize,
  });
  return `/.netlify/images?${params.toString()}`;
}
