import { PrismaClient } from '@prisma/client';
import { extractFolderId, getDriveImageStream, fetchFolderImageDetails } from '../utils/googleDrive.util';
import { uploadImageToSupabase } from '../utils/supabase.util';

const prisma = new PrismaClient();

const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
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

export const syncImagesForProduct = async (productId: string, folderUrl: string) => {
  try {
    console.log(`Starting background sync for product ID: ${productId} from folder: ${folderUrl}`);
    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      console.error(`Invalid folder URL for product ID: ${productId}`);
      return;
    }

    const allPublicUrls = await uploadDriveImagesToSupabase(folderId);

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
    } else {
      console.log(`No images found to sync for product ID: ${productId}`);
    }
  } catch (err: any) {
    console.error(`Failed to sync images for product ID: ${productId}`, err.message);
  }
};
