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

/** True for a customer's own photo ("Customer-1.jpg" in the Drive folder) */
export const isCustomerPhoto = (url?: string | null): boolean =>
  /^customer/i.test(decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || '').replace(/^\d{10,}-/, ''));

/**
 * Photo order everywhere (sync, cards, product page):
 *   Fabric-1 (or, without one, any photo with a "1" in its name) → Close-up → Fabric-2 → Fabric-3
 *   → customer photos → anything else. Raw photos are never shown to customers.
 */
export const isCloseupPhoto = (url?: string | null): boolean =>
  /close[\s_-]*up/i.test(decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || ''));

export const photoRank = (url?: string | null): number => {
  const file = decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || '').replace(/^\d{10,}-/, '').toLowerCase();
  const n = Number((file.match(/(\d+)/) || [])[1] || 0);
  if (/close[\s_-]*up/.test(file)) return 200;
  const fab = file.match(/^fabric[\s_-]*(\d+)/);
  if (fab) { const k = Number(fab[1]); return k === 1 ? 100 : k === 2 ? 300 : k === 3 ? 400 : 450 + k; }
  if (/^customer/.test(file)) return 500 + n;
  if (n === 1) return 150; // no Fabric-1? a photo named with "1" leads
  return 600 + n;
};
