// Mirrors backend/src/utils/rawPhoto.ts — a last line of defence so an admin-only
// "Raw" photo is never shown to customers even if one slips into a product's photos.
const ALLOWED_EXTRA = new Set(['image', 'img', 'photo', 'pic', 'picture', 'original', 'copy']);

export const isRawImageUrl = (url?: string | null): boolean => {
  const file = decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || '').replace(/^\d{10,}-/, '');
  const words = file
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((w) => !/^\d+$/.test(w) && !/^p\d{3,}$/.test(w));
  return words.includes('raw') && words.every((w) => w === 'raw' || ALLOWED_EXTRA.has(w));
};

/** Customer photos only */
export const customerImages = <T extends { url?: string }>(images?: T[] | null): T[] =>
  (images || []).filter((i) => !isRawImageUrl(i?.url));
