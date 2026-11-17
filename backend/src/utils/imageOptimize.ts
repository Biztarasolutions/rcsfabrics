// Shrinks product photos while they are copied from Google Drive to Supabase.
//
// Customers never see more than ~2000 px (the full-screen photo viewer), so
// photos are resized to at most 2000 px on the long side and saved as
// high-quality WebP (quality 90, full colour detail). Typical phone/PNG photos
// drop from ~2.5 MB to ~300–400 KB with no visible difference.
// If anything goes wrong, or the result isn't smaller, the original is kept.
import sharp from 'sharp';

export const MAX_EDGE = 2000;
const QUALITY = 90;

export async function optimizeImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  if (!/^image\/(jpe?g|png|webp|tiff|heic|heif|avif)$/i.test(mimeType || '')) {
    return { buffer, filename, mimeType };
  }
  try {
    const out = await sharp(buffer, { failOn: 'none' })
      .rotate() // respect phone orientation
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY, smartSubsample: true, effort: 5 })
      .toBuffer();
    if (out.length >= buffer.length) return { buffer, filename, mimeType };
    const base = filename.replace(/\.[a-z0-9]+$/i, '');
    console.log(`[Image] ${filename}: ${(buffer.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB`);
    return { buffer: out, filename: `${base}.webp`, mimeType: 'image/webp' };
  } catch (err: any) {
    console.warn(`[Image] Could not optimise ${filename}, keeping original:`, err?.message || err);
    return { buffer, filename, mimeType };
  }
}
