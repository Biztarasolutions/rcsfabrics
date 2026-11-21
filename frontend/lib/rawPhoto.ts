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

/** Same order as the sync: Fabric-1, Fabric-2, customer photos, Fabric-3, then anything else */
export const photoRank = (url?: string | null): number => {
  const file = decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || '').replace(/^\d{10,}-/, '').toLowerCase();
  const n = Number((file.match(/(\d+)/) || [])[1] || 0);
  if (/^customer/.test(file)) return 300 + n;
  const fab = file.match(/^fabric[\s_-]*(\d+)/);
  if (fab) return Number(fab[1]) >= 3 ? 400 + Number(fab[1]) : 100 + Number(fab[1]);
  return 500 + n;
};
