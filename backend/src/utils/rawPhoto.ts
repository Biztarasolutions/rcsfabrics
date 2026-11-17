// "Raw" = the admin-only original fabric photo in each product's Drive folder.
// Recognised in any case and with any extension, e.g. "Raw.jpg", "RAW.png",
// "Raw image.jpg", "P10002 Raw.heic", "raw-1.jpg", "Raw (1).jpg".
// A fabric whose name merely contains the word (e.g. "Raw Silk-1.jpg") is NOT treated as Raw.
import { prisma } from '@/index';

const ALLOWED_EXTRA = new Set(['image', 'img', 'photo', 'pic', 'picture', 'original', 'copy']);

export const isRawFileName = (name: string): boolean => {
  const words = String(name || '')
    .replace(/\.[a-z0-9]+$/i, '')     // extension
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((w) => !/^\d+$/.test(w) && !/^p\d{3,}$/.test(w)); // numbers, product codes
  return words.includes('raw') && words.every((w) => w === 'raw' || ALLOWED_EXTRA.has(w));
};

/** Stored URLs look like …/product-images/1794904590165-Raw.webp */
export const isRawImageUrl = (url: string): boolean => {
  const file = decodeURIComponent(String(url || '').split('?')[0].split('/').pop() || '');
  return isRawFileName(file.replace(/^\d{10,}-/, ''));
};

/**
 * Safety net, run at server start: any Raw photo that ended up among a product's
 * customer photos (e.g. synced before Raw support) is moved to the admin-only slot.
 */
export async function moveRawPhotosOutOfCustomerImages(): Promise<void> {
  try {
    const images = await prisma.productImage.findMany({ select: { id: true, url: true, productId: true, isMain: true } });
    const raws = images.filter((i) => isRawImageUrl(i.url));
    if (!raws.length) return;
    for (const r of raws) {
      const existing = await prisma.productRawImage.findUnique({ where: { productId: r.productId } });
      if (!existing) {
        await prisma.productRawImage.create({ data: { productId: r.productId, url: r.url } });
      }
      await prisma.productImage.delete({ where: { id: r.id } });
      if (r.isMain) {
        const next = await prisma.productImage.findFirst({ where: { productId: r.productId }, orderBy: { order: 'asc' } });
        if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isMain: true } });
      }
    }
    console.log(`[Raw photos] Moved ${raws.length} Raw photo(s) out of customer photos`);
  } catch (err) {
    console.error('[Raw photos] cleanup failed:', err);
  }
}
