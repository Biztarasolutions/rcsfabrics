import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getDriveImageStream, fetchFolderImageDetails, findFolderIdByName } from '../utils/googleDrive.util';
import { uploadImageToSupabase } from '../utils/supabase.util';
import { optimizeImage, photoFingerprint, samePhoto } from '../utils/imageOptimize';
import { isRawFileName } from '../utils/rawPhoto';

const prisma = new PrismaClient();

const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const uploadDriveImagesToSupabase = async (folderId: string): Promise<{ urls: string[]; rawUrl: string | null }> => {
  try {
    const files = (await fetchFolderImageDetails(folderId))
      .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const publicUrls: string[] = [];
    let rawUrl: string | null = null;
    let rawHash: string | null = null;
    const hashes: string[] = [];

    for (const file of files) {
      console.log(`  [Product Sync] Downloading: ${file.name} (${file.id})`);
      const streamRes = await getDriveImageStream(file.id);
      const raw = await streamToBuffer(streamRes.data);
      const hash = (await photoFingerprint(raw)) || createHash('sha1').update(raw).digest('hex');
      const img = await optimizeImage(raw, file.name, file.mimeType || 'image/jpeg');
      const publicUrl = await uploadImageToSupabase(img.buffer, img.filename, img.mimeType);
      
      // A photo named "Raw" is the admin-only original — never a customer photo
      if (isRawFileName(file.name)) { rawUrl = publicUrl; rawHash = hash; }
      else { publicUrls.push(publicUrl); hashes.push(hash); }
      console.log(`  [Product Sync] Uploaded: ${file.name} -> ${publicUrl}`);
    }

    // never keep an exact copy of the Raw photo as a customer photo
    return { urls: publicUrls.filter((_, i) => hashes[i] !== rawHash && !samePhoto(hashes[i], rawHash)), rawUrl };
  } catch (error: any) {
    console.error('  [Product Sync] Error syncing folder:', error.message);
    throw error;
  }
};

export const syncImagesForProduct = async (productId: string, productName: string): Promise<number> => {
  try {
    console.log(`Starting background sync for product ID: ${productId} with name: ${productName}`);
    // Determine the Google Drive folder ID for the product.
    // Primary method: find by product name.
    let folderId = await findFolderIdByName(productName);
    // Fallback: use folderUrl stored on the product or its colors.
    if (!folderId) {
      // Fetch product with folder data.
      const productRecord = await prisma.product.findUnique({
        where: { id: productId },
        include: { colors: true },
      });
      if (productRecord) {
        const possibleUrls = [productRecord.folderUrl, ...productRecord.colors.map((c: any) => c.folderUrl)].filter(Boolean);
        for (const url of possibleUrls) {
          const match = url?.match(/folders\/([a-zA-Z0-9_-]+)/);
          if (match) {
            folderId = match[1];
            break;
          }
        }
      }
    }
    if (!folderId) {
      console.error(`Folder not found in Google Drive for product ID: ${productId}`);
      return 0;
    }

    const { urls: allPublicUrls, rawUrl } = await uploadDriveImagesToSupabase(folderId);
    if (rawUrl) {
      await prisma.productRawImage.upsert({
        where: { productId },
        create: { productId, url: rawUrl },
        update: { url: rawUrl },
      });
    }

    // Photo order on the site: Fabric-1 (flat-lay), Fabric-2 (roll), customer photos, then Fabric-3 (design poster)
    allPublicUrls.sort((a, b) => photoRank(a) - photoRank(b));

    if (allPublicUrls.length > 0) {
      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId } }),
        prisma.productImage.createMany({
          data: allPublicUrls.map((url, index) => ({
            productId,
            url,
            isMain: index === 0,
            order: index
          }))
        })
      ]);
      console.log(`Successfully synced ${allPublicUrls.length} images for product ID: ${productId}`);
      return allPublicUrls.length;
    } else {
      console.log(`No images found to sync for product ID: ${productId}`);
      return 0;
    }
  } catch (err: any) {
    console.error(`Failed to sync images for product ID: ${productId}`, err.message);
    return 0;
  }
};

/** Sort key for a synced photo URL (file name after the upload timestamp) */
export function photoRank(url: string): number {
  const file = decodeURIComponent(String(url).split('?')[0].split('/').pop() || '').replace(/^\d{10,}-/, '').toLowerCase();
  const n = Number((file.match(/(\d+)/) || [])[1] || 0);
  if (/^customer/.test(file)) return 300 + n;
  const fab = file.match(/^fabric[\s_-]*(\d+)/);
  if (fab) return Number(fab[1]) >= 3 ? 400 + Number(fab[1]) : 100 + Number(fab[1]);
  return 500 + n;
}
