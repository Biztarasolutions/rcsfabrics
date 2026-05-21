import { PrismaClient } from '@prisma/client';
import { extractFolderId, getDriveImageStream, fetchFolderImageDetails } from './src/utils/googleDrive.util';
import { uploadImageToSupabase } from './src/utils/supabase.util';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Reusable function to convert a stream to a buffer
const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const processCategoryImage = async (imageUrl: string | null | undefined): Promise<string | null> => {
  if (!imageUrl) return null;

  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([^\/\?]+)/;
  const match = imageUrl.match(driveRegex);
  if (match && match[1]) {
    try {
      const fileId = match[1];
      console.log(`[Category Sync] Google Drive file ID: ${fileId}`);
      const streamRes = await getDriveImageStream(fileId);
      
      const mimeType = streamRes.headers['content-type'] || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const filename = `category_${fileId}.${ext}`;
      
      const buffer = await streamToBuffer(streamRes.data);
      const publicUrl = await uploadImageToSupabase(buffer, filename, mimeType);
      
      console.log(`[Category Sync] Synced: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      console.error(`[Category Sync] Failed for ${imageUrl}:`, err.message);
      return imageUrl;
    }
  }
  return imageUrl;
};

const uploadDriveImagesToSupabase = async (folderId: string): Promise<string[]> => {
  try {
    const files = await fetchFolderImageDetails(folderId);
    const publicUrls: string[] = [];

    for (const file of files) {
      console.log(`  [Product Sync] Downloading: ${file.name} (${file.id})`);
      const streamRes = await getDriveImageStream(file.id);
      const buffer = await streamToBuffer(streamRes.data);
      
      const publicUrl = await uploadImageToSupabase(
        buffer,
        file.name,
        file.mimeType || 'image/jpeg'
      );
      
      publicUrls.push(publicUrl);
      console.log(`  [Product Sync] Uploaded: ${file.name} -> ${publicUrl}`);
    }

    return publicUrls;
  } catch (error: any) {
    console.error('  [Product Sync] Error syncing folder:', error.message);
    throw error;
  }
};

async function main() {
  console.log('=== Starting Image Synchronization Script ===\n');

  // 1. Sync Categories
  console.log('--- Syncing Category Images ---');
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.imageUrl && cat.imageUrl.includes('drive.google.com')) {
      console.log(`Syncing category: ${cat.name}`);
      const syncedUrl = await processCategoryImage(cat.imageUrl);
      if (syncedUrl && syncedUrl !== cat.imageUrl) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { imageUrl: syncedUrl }
        });
        console.log(`Successfully updated category ${cat.name} with synced URL!\n`);
      } else {
        console.log(`Could not sync image for ${cat.name}.\n`);
      }
    } else {
      console.log(`Category ${cat.name} does not have a Google Drive imageUrl. Skipping.\n`);
    }
  }

  // 2. Sync Products
  console.log('--- Syncing Product Images ---');
  const products = await prisma.product.findMany({
    include: { colors: true }
  });

  for (const prod of products) {
    console.log(`Syncing product: ${prod.name}`);
    
    // Gather folders
    const foldersToSync = new Set<string>();
    if (prod.folderUrl) {
      const folderId = extractFolderId(prod.folderUrl);
      if (folderId) foldersToSync.add(folderId);
    }
    for (const color of prod.colors) {
      if (color.folderUrl) {
        const folderId = extractFolderId(color.folderUrl);
        if (folderId) foldersToSync.add(folderId);
      }
    }

    if (foldersToSync.size === 0) {
      console.log(`Product ${prod.name} has no folder URLs configured. Skipping.\n`);
      continue;
    }

    console.log(`Product ${prod.name} has ${foldersToSync.size} Google Drive folder(s) to sync.`);
    const allPublicUrls: string[] = [];
    for (const folderId of foldersToSync) {
      try {
        const urls = await uploadDriveImagesToSupabase(folderId);
        allPublicUrls.push(...urls);
      } catch (err: any) {
        console.error(`Error syncing folder ${folderId} for product ${prod.name}:`, err.message);
      }
    }

    if (allPublicUrls.length > 0) {
      // Clear existing and replace with new
      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: prod.id } }),
        prisma.productImage.createMany({
          data: allPublicUrls.map((url, index) => ({
            productId: prod.id,
            url,
            isMain: index === 0,
            order: index
          }))
        })
      ]);
      console.log(`Successfully synced ${allPublicUrls.length} images for product: ${prod.name}!\n`);
    } else {
      console.log(`No images synced for product: ${prod.name}.\n`);
    }
  }

  console.log('=== Image Synchronization Script Completed Successfully! ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
