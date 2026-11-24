import { createHash } from 'crypto';
import { Response } from 'express';
import { optimizeImage, photoFingerprint, samePhoto } from '@/utils/imageOptimize';
import { isRawFileName } from '@/utils/rawPhoto';
import { customerCode } from '@/utils/customer';
import { prisma } from '@/index';
import { printToken } from '@/utils/printToken';
import { isManager, isStaff, effectiveRole, isSuperAdminEmail, ASSIGNABLE_ROLES } from '@/utils/roles';
import { AuthRequest, ApiResponse } from '@/types';
import {
  generateSlug,
  generateSKU,
  buildStyleCode,
  buildProductCode,
  getDriveFolderNameCandidates,
  extractDesignName,
} from '@/utils/string.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';
import {
  extractFolderId,
  getDriveImageStream,
  DriveFileDetails,
  fetchFolderImageDetails,
  findFolderIdByNames,
  findImageFilesByProductCode,
  folderUrlFromId,
  verifyFolderAccess,
} from '@/utils/googleDrive.util';
import { uploadImageToSupabase } from '@/utils/supabase.util';
import { invalidateProductCaches } from '@/middleware/cache';
import { notifyOrderStatus, resendTeamOrderEmail } from '@/services/orderNotifications';

// Reusable function to convert a stream to a buffer
const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export { isRawFileName };

type SyncedFiles = { urls: string[]; rawUrl: string | null; hashes: string[]; rawHash: string | null };

/** Copies Drive photos to Supabase (shrunk). "Raw" is returned separately, never in `urls`. */
const uploadDriveFilesToSupabase = async (files: DriveFileDetails[]): Promise<SyncedFiles> => {
  const urls: string[] = [];
  const hashes: string[] = [];
  let rawUrl: string | null = null;
  let rawHash: string | null = null;
  const ordered = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const file of ordered) {
    console.log(`[Supabase Upload] Downloading file: ${file.name} (${file.id})`);
    const streamRes = await getDriveImageStream(file.id);
    const raw = await streamToBuffer(streamRes.data);
    const hash = (await photoFingerprint(raw)) || createHash('sha1').update(raw).digest('hex'); // to spot copies of the Raw photo
    const img = await optimizeImage(raw, file.name, file.mimeType || 'image/jpeg');
    const publicUrl = await uploadImageToSupabase(img.buffer, img.filename, img.mimeType);
    if (isRawFileName(file.name)) {
      rawUrl = publicUrl;
      rawHash = hash;
      console.log(`[Supabase Upload] Raw (admin-only) photo: ${file.name} -> ${publicUrl}`);
    } else {
      urls.push(publicUrl);
      hashes.push(hash);
      console.log(`[Supabase Upload] Uploaded successfully: ${file.name} -> ${publicUrl}`);
    }
  }
  return { urls, rawUrl, hashes, rawHash };
};

/**
 * Downloads all images from a product-code-named Drive folder.
 * Image filenames inside the folder can be anything (e.g. Stretchable-1.png);
 * a file named "Raw" is kept apart as the admin-only original.
 */
const uploadAllImagesFromFolder = async (folderId: string): Promise<SyncedFiles> => {
  try {
    const accessible = await verifyFolderAccess(folderId);
    if (!accessible) {
      throw new Error(`Cannot access folder ${folderId}. Share it with the service account.`);
    }
    const files = await fetchFolderImageDetails(folderId);
    return uploadDriveFilesToSupabase(files);
  } catch (error) {
    console.error('[Supabase Upload] Error syncing images:', error);
    throw error;
  }
};

type ProductWithColors = {
  id: string;
  name: string;
  code?: number | null;
  styleCode?: string | null;
  folderUrl?: string | null;
  colors: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    folderUrl?: string | null;
  }>;
};

const saveSyncedImages = async (productId: string, supabaseUrls: string[], rawUrl: string | null = null) => {
  if (rawUrl) {
    await prisma.productRawImage.upsert({
      where: { productId },
      create: { productId, url: rawUrl },
      update: { url: rawUrl },
    });
  }
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    ...(supabaseUrls.length > 0
      ? [
          prisma.productImage.createMany({
            data: supabaseUrls.map((url, index) => ({
              productId,
              url,
              isMain: index === 0,
              order: index,
            })),
          }),
        ]
      : []),
  ]);
};

const collectFolderIdsForProduct = async (
  product: ProductWithColors,
  categoryName: string
): Promise<Set<string>> => {
  const folders = new Set<string>();

  const addFromUrl = async (url?: string | null) => {
    const folderId = url ? extractFolderId(url) : null;
    if (!folderId) return;
    const accessible = await verifyFolderAccess(folderId);
    if (accessible) folders.add(folderId);
  };

  await addFromUrl(product.folderUrl);
  for (const color of product.colors) {
    await addFromUrl(color.folderUrl);
  }

  const code = product.code ?? '000';
  const styleCandidates = getDriveFolderNameCandidates({
    name: product.name,
    categoryName,
    code,
  });

  const isGenericProduct = product.colors.length === 0 || (product.colors.length === 1 && product.colors[0].name === 'Unknown');

  let productFolderUrl = product.folderUrl;
  if (productFolderUrl) {
    const savedId = extractFolderId(productFolderUrl);
    if (!savedId || !(await verifyFolderAccess(savedId))) {
      await prisma.product.update({ where: { id: product.id }, data: { folderUrl: null } });
      productFolderUrl = null;
    }
  }

  if (!productFolderUrl && isGenericProduct) {
    const styleLookupNames = product.styleCode
      ? [product.styleCode, ...styleCandidates]
      : styleCandidates;
    const styleMatch = await findFolderIdByNames(styleLookupNames);
    if (styleMatch) {
      folders.add(styleMatch.folderId);
      await prisma.product.update({
        where: { id: product.id },
        data: { folderUrl: folderUrlFromId(styleMatch.folderId) },
      });
    }
  }

  for (const color of product.colors) {
    if (color.folderUrl) {
      const savedId = extractFolderId(color.folderUrl);
      if (savedId && (await verifyFolderAccess(savedId))) continue;
      // Saved folder was deleted or moved out of reach: forget it and search by name again
      await prisma.productColor.update({ where: { id: color.id }, data: { folderUrl: null } });
    }

    const candidates = [
      ...(color.productCode ? [color.productCode] : []),
      ...getDriveFolderNameCandidates({
        name: product.name,
        categoryName,
        code,
        colorName: color.name,
      }),
    ];

    const match = await findFolderIdByNames(candidates);
    if (match) {
      folders.add(match.folderId);
      await prisma.productColor.update({
        where: { id: color.id },
        data: { folderUrl: folderUrlFromId(match.folderId) },
      });
    }
  }

  return folders;
};

const collectProductCodesForSync = (
  product: ProductWithColors,
  categoryName: string
): string[] => {
  const codes = new Set<string>();
  const numericCode = product.code ?? '000';

  if (product.styleCode) codes.add(product.styleCode.trim());

  for (const color of product.colors) {
    if (color.productCode?.trim()) {
      codes.add(color.productCode.trim());
    } else {
      getDriveFolderNameCandidates({
        name: product.name,
        categoryName,
        code: numericCode,
        colorName: color.name,
      }).forEach((c) => codes.add(c));
    }
  }

  if (product.colors.length === 0) {
    getDriveFolderNameCandidates({
      name: product.name,
      categoryName,
      code: numericCode,
    }).forEach((c) => codes.add(c));
  }

  return [...codes];
};

const syncImagesForProduct = async (
  product: ProductWithColors,
  categoryName: string
): Promise<number> => {
  const folderIds = await collectFolderIdsForProduct(product, categoryName);
  const productCodes = collectProductCodesForSync(product, categoryName);

  const supabaseUrls: string[] = [];
  const urlHash = new Map<string, string>();
  let rawUrl: string | null = null;
  let rawHash: string | null = null;
  const uploadedFileIds = new Set<string>();
  const syncedFolderIds = new Set<string>();
  const collect = (res: SyncedFiles) => {
    supabaseUrls.push(...res.urls);
    res.urls.forEach((u, i) => urlHash.set(u, res.hashes[i]));
    if (res.rawUrl && !rawUrl) { rawUrl = res.rawUrl; rawHash = res.rawHash; }
  };

  const syncFolderOnce = async (folderId: string) => {
    if (syncedFolderIds.has(folderId)) return;
    syncedFolderIds.add(folderId);
    collect(await uploadAllImagesFromFolder(folderId));
  };

  // 1) Folders from saved URLs or name search — sync every image inside
  for (const folderId of folderIds) {
    try {
      await syncFolderOnce(folderId);
    } catch (err: any) {
      console.error(`[Sync] Failed folder ${folderId}:`, err.message || err);
    }
  }

  // 2) Try discovering folders by product code name
  for (const color of product.colors) {
    const candidates = [
      ...(color.productCode ? [color.productCode] : []),
      ...getDriveFolderNameCandidates({
        name: product.name,
        categoryName,
        code: product.code ?? '000',
        colorName: color.name,
      }),
    ];
    const folderMatch = await findFolderIdByNames(candidates);
    if (!folderMatch) continue;

    folderIds.add(folderMatch.folderId);
    if (!color.folderUrl) {
      await prisma.productColor.update({
        where: { id: color.id },
        data: { folderUrl: folderUrlFromId(folderMatch.folderId) },
      });
    }
    try {
      await syncFolderOnce(folderMatch.folderId);
    } catch (err: any) {
      console.error(`[Sync] Failed folder "${folderMatch.matchedName}":`, err.message || err);
    }
  }

  // 3) Standalone image files named like product code (not inside a product folder)
  for (const productCode of productCodes) {
    const matchedFiles = await findImageFilesByProductCode(productCode);
    const newFiles = matchedFiles.filter((f) => !uploadedFileIds.has(f.id));
    if (newFiles.length === 0) continue;
    newFiles.forEach((f) => uploadedFileIds.add(f.id));
    try {
      collect(await uploadDriveFilesToSupabase(newFiles));
    } catch (err: any) {
      console.error(`[Sync] Failed uploading files for code "${productCode}":`, err.message || err);
    }
  }

  // Drop exact copies of the Raw photo, and duplicates of the same photo found in two places
  const seenHashes = new Set<string>();
  const uniqueUrls = [...new Set(supabaseUrls)].filter((u) => {
    const h = urlHash.get(u);
    if (!h) return true;
    if (h === rawHash || samePhoto(h, rawHash)) { console.log(`[Sync] Skipped a copy of the Raw photo: ${u}`); return false; }
    if (seenHashes.has(h)) return false; // same photo found in two places
    seenHashes.add(h);
    return true;
  });

  if (uniqueUrls.length === 0) {
    const codesHint = productCodes.slice(0, 3).join(', ');
    throw new ApiError(
      400,
      `No images found for product code(s): ${codesHint}. Add the Google Drive folder link on the product (folder name should match the product code), put images inside, and share the folder with the service account.`
    );
  }

  await saveSyncedImages(product.id, uniqueUrls, rawUrl);
  return uniqueUrls.length;
};

export const createProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can create products');
    }

    const {
      name,
      categoryId,
      code,
      basePrice,
      discountPrice,
      discountType,
      discountValue,
      width,
      pattern,
      stretchability,
      minOrderQty,
      colors,
    } = req.body;

    if (!name || !categoryId || !basePrice || !code) {
      throw new ApiError(400, 'Name, category, code, and price are required');
    }

    // Get category to build styleCode
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const cleanedName = extractDesignName(name, category.name, code);
    const styleCode = buildStyleCode(cleanedName, category.name, code);

    let processedColors: any[] = [];
    if (colors && Array.isArray(colors) && colors.length > 0) {
      processedColors = await Promise.all(colors.map(async (color: any) => {
        const pCode = buildProductCode(cleanedName, category.name, color.name || 'Unknown', code);
        let fUrl = '';
        const candidates = getDriveFolderNameCandidates({
          name: cleanedName,
          categoryName: category.name,
          code,
          colorName: color.name || 'Unknown',
        });
        const match = await findFolderIdByNames([pCode, ...candidates]);
        if (match) fUrl = folderUrlFromId(match.folderId);
        
        return {
          name: color.name,
          hexCode: color.hexCode,
          inventory: Number(color.inventory) || 0,
          productCode: pCode,
          folderUrl: fUrl,
        };
      }));
    }

    // Refuse duplicates: same product code (design + category + colour + code) already in the shop
    const plannedCodes = (processedColors.length ? processedColors.map((c: any) => c.productCode)
      : [buildProductCode(cleanedName, category.name, 'Unknown', code)]);
    const dupes = await prisma.product.findMany({
      where: { OR: plannedCodes.flatMap((c: string) => [
        { productCode: { equals: c, mode: 'insensitive' as const } },
        { slug: generateSlug(c) },
      ]) },
      select: { productCode: true, name: true },
    });
    if (dupes.length) {
      throw new ApiError(409, `Duplicate product — already exists: ${dupes.map((d) => d.productCode || d.name).join(', ')}. Nothing was saved.`);
    }

    const createdProducts = [];
    
    // Fallback if no colors are provided, create at least one product
    const colorsList = processedColors.length > 0 ? processedColors : [{
      name: 'Unknown',
      hexCode: '#000000',
      inventory: 0,
      productCode: buildProductCode(cleanedName, category.name, 'Unknown', code),
      folderUrl: '',
    }];

    for (const colorVar of colorsList) {
      const slug = generateSlug(colorVar.productCode);
      const product = await prisma.product.create({
        data: {
          name: cleanedName,
          slug,
          description: category.description,
          categoryId,
          code,
          styleCode,
          productCode: colorVar.productCode,
          basePrice,
          discountPrice,
          discountType,
          discountValue,
          width,
          pattern,
          occasion: category.bestFor?.join(', ') || undefined,
          color: colorVar.name,
          stretchability,
          totalStock: colorVar.inventory,
          minOrderQty: minOrderQty || 0.5,
          sku: generateSKU('FAB'),
          bestFor: category.bestFor,
          properties: category.properties,
          colors: {
            create: {
              name: colorVar.name,
              hexCode: colorVar.hexCode || '#000000',
              productCode: colorVar.productCode,
              folderUrl: colorVar.folderUrl,
            }
          }
        },
        include: { colors: true }
      });

      // Sync images automatically using productCode folder matching
      try {
        const productForSync: ProductWithColors = {
          id: product.id,
          name: product.name,
          code: product.code,
          styleCode: product.styleCode,
          folderUrl: product.folderUrl,
          colors: product.colors.map((c: any) => ({
            id: c.id,
            name: c.name,
            productCode: c.productCode,
            folderUrl: c.folderUrl,
          })),
        };
        await syncImagesForProduct(productForSync, category.name);
      } catch (syncErr: any) {
        console.warn(`[Create] Image auto-sync skipped for variant "${colorVar.productCode}":`, syncErr.message || syncErr);
      }

      const productWithImages = await prisma.product.findUnique({
        where: { id: product.id },
        include: { colors: true, images: { orderBy: { order: 'asc' } } },
      });

      createdProducts.push(productWithImages || product);
    }

    invalidateProductCaches();

    res.status(201).json({
      success: true,
      message: createdProducts.length > 1
        ? `Product family created with ${createdProducts.length} variants.`
        : 'Product created successfully.',
      data: createdProducts[0],
      statusCode: 201,
    } as ApiResponse);
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can update products');
    }

    const { id } = req.params;
    const { 
      id: bodyId, 
      createdAt, 
      updatedAt, 
      images, 
      category, 
      reviews,
      imageUrls, 
      folderUrl,
      colors,      // extract colors so we can handle it as a relation
      ...updateData 
    } = req.body;

    // Whitelist allowed fields to prevent extra properties like workType or variants from reaching Prisma
    const allowedFields = [
      'name', 'categoryId', 'code', 'basePrice', 'discountPrice', 'discountPercent', 'discountType',
      'discountValue', 'width', 'pattern', 'occasion', 'color', 'stretchability',
      'totalStock', 'minOrderQty', 'bestFor', 'properties', 'sku', 'productCode', 'folderUrl',
      'rating', 'ratingCount', 'isActive', 'isFeatured', 'isNew', 'description', 'styleCode', 'slug'
    ];

    const cleanedUpdateData = {} as any;
    for (const key of allowedFields) {
      if (key in updateData) {
        let value = updateData[key];
        
        // Skip null/undefined/empty-string for required fields to avoid database constraint violations
        if (['name', 'categoryId', 'code', 'basePrice', 'width', 'pattern', 'color', 'stretchability', 'totalStock', 'minOrderQty'].includes(key)) {
          if (value === null || value === undefined || value === '') {
            continue;
          }
        }
        
        // Convert numeric fields
        if (['code', 'basePrice', 'discountPrice', 'discountPercent', 'discountValue', 'width', 'totalStock', 'minOrderQty', 'rating', 'ratingCount'].includes(key)) {
          if (value !== null && value !== undefined && value !== '') {
            value = Number(value);
          } else {
            value = null;
          }
        }
        
        cleanedUpdateData[key] = value;
      }
    }

    // Build the update payload, ensuring numeric fields are properly parsed
    const existingProduct = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!existingProduct) {
      throw new ApiError(404, 'Product not found');
    }

    const categoryName = existingProduct.category?.name || 'Unknown';
    const productCode = cleanedUpdateData.code ?? existingProduct.code ?? '000';

    // Clean name in case it contains category, code, or color variants
    let name = cleanedUpdateData.name || existingProduct.name;
    const cleanedName = extractDesignName(name, categoryName, productCode);
    if (cleanedUpdateData.name !== undefined) {
      cleanedUpdateData.name = cleanedName;
    }

    // styleCode should also be updated if name or code changes
    if (cleanedUpdateData.name !== undefined || cleanedUpdateData.code !== undefined) {
      cleanedUpdateData.styleCode = buildStyleCode(cleanedName, categoryName, productCode);
    }
    
    let processedColors: any[] | undefined = undefined;
    if (colors !== undefined && Array.isArray(colors)) {
      processedColors = await Promise.all(colors.map(async (c: any) => {
        const colorName = c.name?.trim() || 'Unknown';
        const pCode = buildProductCode(cleanedName, categoryName, colorName, productCode);
        
        let fUrl = '';
        const candidates = getDriveFolderNameCandidates({
          name: cleanedName,
          categoryName: categoryName,
          code: productCode,
          colorName: colorName,
        });
        const match = await findFolderIdByNames([pCode, ...candidates]);
        if (match) fUrl = folderUrlFromId(match.folderId);
        
        return {
          name:        colorName,
          hexCode:     c.hexCode ? (c.hexCode.startsWith('#') ? c.hexCode : `#${c.hexCode}`) : '#000000',
          folderUrl:   fUrl,
          productCode: pCode,
          inventory:   Number(c.inventory) || 0,
        };
      }));
    }

    const styleCodeToUpdate = cleanedUpdateData.styleCode || existingProduct.styleCode;

    if (processedColors !== undefined && styleCodeToUpdate) {
      // Synchronize all variants for this styleCode
      const existingVariants = await prisma.product.findMany({
        where: { styleCode: styleCodeToUpdate }
      });

      const processedProductCodes = processedColors.map(c => c.productCode);

      // Delete variants that were removed
      const variantsToDelete = existingVariants.filter(v => !processedProductCodes.includes(v.productCode));
      for (const v of variantsToDelete) {
        await prisma.product.delete({ where: { id: v.id } });
      }

      // Base payload common to all variants
      // Compute discountPrice if discountValue/type provided
      if (cleanedUpdateData.discountValue !== undefined && cleanedUpdateData.discountType) {
        const base = cleanedUpdateData.basePrice ?? existingProduct.basePrice;
        const type = cleanedUpdateData.discountType.toLowerCase();
        const value = Number(cleanedUpdateData.discountValue);
        let discountPrice: number | null = null;
        if (type === 'percentage') {
          discountPrice = base - Math.round((base * value) / 100);
        } else if (type === 'fixed') {
          discountPrice = base - value;
        }
        cleanedUpdateData.discountPrice = discountPrice && discountPrice > 0 ? discountPrice : null;
      }
      const { price, // remove any stray price field if present
        ...payload } = cleanedUpdateData;
      const updatePayload = payload;

      // Update existing or create new variants
      for (const c of processedColors) {
        const existing = existingVariants.find(v => v.productCode === c.productCode);
        const variantData = {
          ...updatePayload,
          slug: generateSlug(c.productCode),
          totalStock: c.inventory,
          color: c.name,
          productCode: c.productCode,
          colors: {
            deleteMany: {},
            create: [{
              name: c.name,
              hexCode: c.hexCode,
              folderUrl: c.folderUrl,
              productCode: c.productCode,
            }]
          }
        };

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: variantData
          });
        } else {
          // Create new variant
          await prisma.product.create({
            data: {
              ...variantData,
              colors: {
                create: variantData.colors.create
              },
              name: cleanedName,
              categoryId: existingProduct.categoryId,
              code: Number(productCode),
              styleCode: styleCodeToUpdate,
              basePrice: cleanedUpdateData.basePrice ?? existingProduct.basePrice,
              width: cleanedUpdateData.width ?? existingProduct.width,
              pattern: cleanedUpdateData.pattern ?? existingProduct.pattern,
              stretchability: cleanedUpdateData.stretchability ?? existingProduct.stretchability ?? 'Non-Stretch',
              minOrderQty: cleanedUpdateData.minOrderQty ?? existingProduct.minOrderQty,
              description: cleanedUpdateData.description ?? existingProduct.description,
              discountPrice: cleanedUpdateData.discountPrice ?? existingProduct.discountPrice,
              discountPercent: cleanedUpdateData.discountPercent ?? existingProduct.discountPercent,
              discountType: cleanedUpdateData.discountType ?? existingProduct.discountType,
              discountValue: cleanedUpdateData.discountValue ?? existingProduct.discountValue,
              occasion: cleanedUpdateData.occasion ?? existingProduct.occasion,
              bestFor: cleanedUpdateData.bestFor ?? existingProduct.bestFor,
              properties: cleanedUpdateData.properties ?? existingProduct.properties,
              isActive: cleanedUpdateData.isActive ?? existingProduct.isActive,
            }
          });
        }
      }
    } else {
      // Fallback for single product update without colors array
      
      // Update slug if name or code changed
      if (cleanedUpdateData.name !== undefined || cleanedUpdateData.code !== undefined) {
        const colorName = existingProduct.color || 'Unknown';
        const updatedProductCode = buildProductCode(cleanedName, categoryName, colorName, productCode);
        cleanedUpdateData.productCode = updatedProductCode;
        cleanedUpdateData.slug = generateSlug(updatedProductCode);
      }

      await prisma.product.update({
  where: { id },
  data: cleanedUpdateData,
});
    }

    const product = await prisma.product.findUnique({ where: { id }, include: { colors: true } });

    let finalImageUrls: string[] | null = null;
    if (folderUrl) {
      const folderId = extractFolderId(folderUrl);
      if (folderId) {
        const synced = await uploadAllImagesFromFolder(folderId);
        finalImageUrls = synced.urls.filter((_, i) => !samePhoto(synced.hashes[i], synced.rawHash) && synced.hashes[i] !== synced.rawHash);
        if (synced.rawUrl) {
          await prisma.productRawImage.upsert({
            where: { productId: id },
            create: { productId: id, url: synced.rawUrl },
            update: { url: synced.rawUrl },
          });
        }
      }
    } else if (imageUrls && Array.isArray(imageUrls)) {
      finalImageUrls = imageUrls.filter((url: string) => url);
    }

    if (finalImageUrls && finalImageUrls.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      
      await prisma.productImage.createMany({
        data: finalImageUrls.map((url: string, index: number) => ({
          productId: id,
          url,
          isMain: index === 0,
          order: index
        }))
      });
    } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length === 0) {
      // Allow clearing all images if empty array provided
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }

    invalidateProductCaches();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can delete products');
    }

    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Determine all product IDs sharing the same styleCode (including the target)
    let productIds: string[] = [id];
    if (product.styleCode) {
      const related = await prisma.product.findMany({
        where: { styleCode: product.styleCode },
        select: { id: true },
      });
      productIds = related.map((p) => p.id);
    }

    // Delete associated colors and images
    await prisma.productColor.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });

    // Delete the product(s)
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });

    invalidateProductCaches();

    res.json({
      success: true,
      message: `Deleted ${productIds.length} product variant(s) successfully`,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const getAdminProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can access this');
    }

    const { page, limit, search } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string
    );

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Step 1: Paginate by styleCode
    const groupedStyles = await prisma.product.groupBy({
      by: ['styleCode'],
      where: {
        ...where,
        // styleCode: { not: null }, // Temporarily disabled to show all products including those without styleCode
      },
      _min: { createdAt: true },
      orderBy: { _min: { createdAt: 'desc' } },
      skip,
      take: parsedLimit,
    });

    const styleCodes = groupedStyles.map(g => g.styleCode).filter(Boolean) as string[];

    const totalGroups = await prisma.product.groupBy({
      by: ['styleCode'],
      where: {
        ...where,
        // styleCode: { not: null }, // Temporarily disabled to show all products including those without styleCode
      },
    });


    // Step 2: Fetch all variants for these styleCodes
    const variantWhere: any = { OR: [] };
    if (styleCodes.length > 0) {
      variantWhere.OR.push({ styleCode: { in: styleCodes } });
    }
    const hasNullStyleCode = groupedStyles.some(g => g.styleCode === null);
    if (hasNullStyleCode) {
      variantWhere.OR.push({ styleCode: null, ...where });
    }
    if (variantWhere.OR.length === 0) {
      variantWhere.id = 'none';
    }

    const flatProducts = await prisma.product.findMany({
      where: variantWhere,
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        rawImage: { select: { url: true } }, // admin thumbnail (original photo)
        category: {
          select: { name: true, id: true },
        },
        colors: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Step 3: Group them into a single row per styleCode
    const groupedProductsMap = new Map();
    for (const p of flatProducts) {
      const colorsWithStock = p.colors.map((c: any) => ({
        ...c,
        stock: p.totalStock,
      }));

      // Handle products without styleCode by adding them as individual entries
      if (!p.styleCode) {
        groupedProductsMap.set(p.id, {
          ...p,
          variants: [p],
          colors: colorsWithStock,
        });
        continue;
      }
      if (!groupedProductsMap.has(p.styleCode)) {
        groupedProductsMap.set(p.styleCode, {
          ...p,
          variants: [p],
          colors: colorsWithStock, // start with its own color
        });
      } else {
        const group = groupedProductsMap.get(p.styleCode);
        group.variants.push(p);
        if (!group.rawImage && p.rawImage) group.rawImage = p.rawImage;
        group.totalStock += p.totalStock; // Aggregate stock
        group.colors.push(...colorsWithStock); // Aggregate colors
      }
    }

    const products = Array.from(groupedProductsMap.values());
    const total = totalGroups.length;

    const meta = createPaginationMeta(total, parsedPage, parsedLimit);

    res.json({
      success: true,
      message: 'Products retrieved',
      data: {
        products,
        ...meta,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const getAdminOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isManager(req.user.role)) {
      throw new ApiError(403, 'Only admins can access this');
    }

    const { page, limit, status, search } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string,
      status === 'ALL' ? 5000 : 100
    );

    const where: any = status === 'ALL'
      ? {}
      : status
        ? { status }
        : { status: { not: 'CANCELLED' } };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true, phone: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              pricePerMeter: true,
              total: true,
              productName: true,
              productImage: true,
              product: { select: { sku: true, code: true, color: true, basePrice: true } },
            },
          },
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const meta = createPaginationMeta(total, parsedPage, parsedLimit);

    res.json({
      success: true,
      message: 'Orders retrieved',
      data: {
        // printToken: lets the admin open the printable label / bill pages
        orders: orders.map((o) => ({ ...o, printToken: printToken(o.id) })),
        ...meta,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const getCancelledOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isManager(req.user.role)) throw new ApiError(403, 'Forbidden');

    const { page, limit } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(page as string, limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'CANCELLED' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true, phone: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              pricePerMeter: true,
              total: true,
              productName: true,
              productImage: true,
              product: { select: { sku: true, code: true, color: true, basePrice: true } },
            },
          },
        },
        skip,
        take: parsedLimit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
    ]);

    const meta = createPaginationMeta(total, parsedPage, parsedLimit);

    // Resolve old email-format cancelledBy values to display names (for records
    // created before the admin had a name saved in their profile).
    const emailsToResolve = [...new Set(
      orders
        .map((o: any) => o.cancelledBy)
        .filter((v: string | null) => v && v.includes('@'))
    )];
    let emailNameMap: Record<string, string> = {};
    if (emailsToResolve.length > 0) {
      const admins = await prisma.user.findMany({
        where: { email: { in: emailsToResolve } },
        select: { email: true, firstName: true, lastName: true },
      });
      for (const admin of admins) {
        const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim();
        emailNameMap[admin.email] = fullName || admin.email;
      }
    }

    const resolvedOrders = orders.map((o: any) => ({
      ...o,
      cancelledBy: o.cancelledBy && o.cancelledBy.includes('@')
        ? (emailNameMap[o.cancelledBy] || o.cancelledBy)
        : o.cancelledBy,
    }));

    res.json({
      success: true,
      data: { orders: resolvedOrders, ...meta },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isManager(req.user.role)) {
      throw new ApiError(403, 'Only admins can update orders');
    }

    const { id } = req.params;
    const { paymentStatus } = req.body;
    let status: string | undefined = req.body.status;
    // Adding a tracking number ships the order
    const rawTracking = req.body.trackingNumber;
    const trackingNumber = typeof rawTracking === 'string' ? rawTracking.trim().slice(0, 120) : undefined;

    // Fetch current order before updating so we can conditionally restore inventory.
    const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new ApiError(404, 'Order not found');
    if (trackingNumber && !status && ['PENDING', 'PROCESSING'].includes(existing.status)) status = 'SHIPPED';
    if (trackingNumber && ['CANCELLED', 'RETURNED'].includes(existing.status)) {
      throw new ApiError(400, 'This order is cancelled — tracking cannot be added');
    }

    // Restore stock when transitioning INTO cancelled (not if already cancelled).
    if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      await Promise.all(
        existing.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { totalStock: { increment: item.quantity } },
          })
        )
      );
    }

    // Resolve admin display name for cancelledBy (JWT only carries email).
    let cancelledByValue: string | undefined;
    if (status === 'CANCELLED') {
      const adminUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { firstName: true, lastName: true, email: true },
      });
      cancelledByValue = adminUser
        ? [adminUser.firstName, adminUser.lastName].filter(Boolean).join(' ').trim() || adminUser.email
        : req.user!.email;
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status as any,
        paymentStatus,
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
        ...(status === 'DELIVERED' && existing.status !== 'DELIVERED' && { deliveredAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledBy: cancelledByValue }),
      },
      include: {
        items: true,
      },
    });

    // Email the customer when the status actually changes
    if (status && status !== existing.status) void notifyOrderStatus(id, status);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isManager(req.user.role)) {
      throw new ApiError(403, 'Only admins can access this');
    }

    // Optional status filter — affects order count + revenue (not customers/products)
    const { status } = req.query as { status?: string };
    const orderWhere: any = status ? { status } : {};

    const [totalOrders, totalRevenue, totalCustomers, totalProducts] = await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: orderWhere,
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
    ]);

    const lowStockThreshold = 10;
    const lowStockCount = await prisma.product.count({
      where: { totalStock: { lt: lowStockThreshold } },
    });

    res.json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalCustomers,
        totalProducts,
        lowStockCount,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

// ── Analytics ───────────────────────────────────────────────────────────

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !isManager(req.user.role)) throw new ApiError(403, 'Forbidden');

    const { from, to, status } = req.query as { from?: string; to?: string; status?: string };

    const startDate = from ? new Date(from) : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Status filter: specific status if given, otherwise all except CANCELLED
    const statusFilter: any = status ? { status } : { status: { not: 'CANCELLED' } };

    // Orders in date range matching status filter
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...statusFilter,
      },
      select: {
        id: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily grouped revenue + order count
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dailyMap[d.toISOString().slice(0, 10)] = { revenue: 0, orders: 0 };
    }
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      if (dailyMap[day]) {
        dailyMap[day].orders += 1;
        dailyMap[day].revenue += Number(o.total);
      }
    }
    const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

    // Repeat vs new customers (users with >1 order ever)
    const uniqueUserIds = [...new Set(orders.map(o => o.userId))];
    const repeatUserIds = uniqueUserIds.length > 0
      ? await prisma.order.groupBy({
          by: ['userId'],
          where: { userId: { in: uniqueUserIds } },
          having: { userId: { _count: { gt: 1 } } },
          _count: { userId: true },
        })
      : [];
    const repeatCustomers = repeatUserIds.length;
    const newCustomers = uniqueUserIds.length - repeatCustomers;

    // Revenue by payment method
    const byMethod: Record<string, number> = {};
    for (const o of orders) {
      const m = o.paymentMethod || 'UNKNOWN';
      byMethod[m] = (byMethod[m] || 0) + Number(o.total);
    }

    // Total customers ever
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });

    // Top products in period (from order items)
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productName'],
      where: { order: { createdAt: { gte: startDate, lte: endDate }, ...statusFilter } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });
    const topProducts = topProductsRaw.map(p => ({
      name: p.productName,
      quantity: Number(p._sum.quantity || 0),
      revenue: Number(p._sum.total || 0),
    }));

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        aov,
        totalCustomers,
        newCustomers,
        repeatCustomers,
        daily,
        byMethod,
        topProducts,
        dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

// ── Inventory Management ────────────────────────────────────────────────

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lowStock } = req.query;
    const where: any = { isActive: true };
    if (lowStock === 'true') where.totalStock = { lte: 10 };

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        totalStock: true,
        minOrderQty: true,
        category: { select: { name: true } },
        images: { take: 1, select: { url: true } },
        orderItems: {
          orderBy: { order: { createdAt: 'desc' } },
          take: 5,
          select: {
            quantity: true,
            order: { select: { createdAt: true, orderNumber: true, status: true } },
          },
        },
      },
      orderBy: { totalStock: 'asc' },
    });

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;
    const delta = parseFloat(adjustment);

    if (isNaN(delta)) {
      res.status(400).json({ success: false, message: 'adjustment must be a number' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id }, select: { totalStock: true, name: true } });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }

    const newStock = Math.max(0, product.totalStock + delta);
    const updated = await prisma.product.update({
      where: { id },
      data: { totalStock: newStock },
      select: { id: true, name: true, totalStock: true },
    });

    console.log(`[Inventory] ${updated.name}: ${product.totalStock} → ${newStock} (${delta > 0 ? '+' : ''}${delta}) | Reason: ${reason || 'manual adjustment'}`);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Settings Management ──────────────────────────────────────────────────

const DEFAULT_SETTINGS = [
  { key: 'payment_upi_enabled', value: 'true', label: 'UPI Payment' },
  { key: 'payment_cod_enabled', value: 'true', label: 'Cash on Delivery' },
  { key: 'payment_online_enabled', value: 'true', label: 'Online payment (Cashfree)' },
  { key: 'upi_id', value: 'MAB0450543A0000066@Yesbank', label: 'UPI ID' },
  { key: 'upi_name', value: 'Rajasthan Cloth Store', label: 'UPI Display Name' },
];

export const getSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Seed defaults if missing
    for (const s of DEFAULT_SETTINGS) {
      await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
    }
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ success: true, data: { settings, map } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) { res.status(400).json({ success: false, message: 'value is required' }); return; }
    const updated = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Public endpoint — no auth required
export const getPublicSettings = async (_req: any, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany({ where: { key: { in: ['payment_upi_enabled', 'payment_cod_enabled', 'payment_online_enabled', 'upi_id', 'upi_name'] } } });
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    // Return safe defaults if DB not seeded yet
    res.json({ success: true, data: { payment_upi_enabled: 'true', payment_cod_enabled: 'true', payment_online_enabled: 'true', upi_id: 'MAB0450543A0000066@Yesbank', upi_name: 'Rajasthan Cloth Store', ...map } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Coupon Management ───────────────────────────────────────────────────

export const getCoupons = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'Coupons retrieved',
      data: coupons,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

export const createCoupon = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      perUserLimit,
      firstOrderOnly,
      expiresAt,
    } = req.body;

    if (!code || !discountType || !discountValue) {
      throw new ApiError(400, 'Code, type, and value are required');
    }

    // If no expiry given, set far future (effectively no expiry until manually deactivated)
    const expiry = expiresAt ? new Date(expiresAt) : new Date('2099-12-31T23:59:59Z');

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount || null,
        maxUses: maxUses || null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : null,
        firstOrderOnly: !!firstOrderOnly,
        startsAt: new Date(),
        expiresAt: expiry,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const updateCoupon = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, perUserLimit, firstOrderOnly } = req.body;
    const data: any = {};
    if (isActive !== undefined) data.isActive = !!isActive;
    if (perUserLimit !== undefined) data.perUserLimit = perUserLimit ? Number(perUserLimit) : null;
    if (firstOrderOnly !== undefined) data.firstOrderOnly = !!firstOrderOnly;
    const coupon = await prisma.coupon.update({ where: { id }, data });
    res.json({ success: true, message: 'Coupon updated', data: coupon, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
  }
};

export const deleteCoupon = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

// ── Category Management ──────────────────────────────────────────────────

export const getCategories = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      message: 'Categories retrieved',
      data: categories,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

// Reusable helper to process category images from Google Drive links to Supabase
const processCategoryImage = async (imageUrl: string | null | undefined): Promise<string | null> => {
  if (!imageUrl) return null;

  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([^\/\?]+)/;
  const match = imageUrl.match(driveRegex);
  if (match && match[1]) {
    try {
      const fileId = match[1];
      console.log(`[Category Image Sync] Google Drive file detected. File ID: ${fileId}`);
      const streamRes = await getDriveImageStream(fileId);
      
      const mimeType = streamRes.headers['content-type'] || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const filename = `category_${fileId}.${ext}`;
      
      const buffer = await streamToBuffer(streamRes.data);
      const publicUrl = await uploadImageToSupabase(buffer, filename, mimeType);
      
      console.log(`[Category Image Sync] Successfully uploaded category image from Drive to Supabase: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      console.error('[Category Image Sync] Failed to download/upload image from Google Drive:', err);
      return imageUrl;
    }
  }
  return imageUrl;
};

export const createCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      isActive,
      gender,
      bestFor,
      properties,
      imageUrl,
    } = req.body;
    if (!name || !slug) throw new ApiError(400, 'Name and slug are required');

    let processedImageUrl = imageUrl || null;
    if (imageUrl) {
      processedImageUrl = await processCategoryImage(imageUrl);
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        isActive: isActive ?? true,
        gender: gender || 'women',
        bestFor: bestFor || [],
        properties: properties || [],
        imageUrl: processedImageUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created',
      data: category,
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create category', statusCode: 500 } as ApiResponse);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.imageUrl) {
      data.imageUrl = await processCategoryImage(data.imageUrl);
    }

    const category = await prisma.category.update({ where: { id }, data });

    res.json({ success: true, message: 'Category updated', data: category, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category', statusCode: 500 } as ApiResponse);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can delete categories');
    }

    const { id } = req.params;

    // Check if the category exists first
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found or has already been deleted');
    }

    // Check if any products are currently associated with this category
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category: ${productCount} product(s) are currently associated with it. Please reassign or delete these products first.`
      );
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully', statusCode: 200 } as ApiResponse);
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete category',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

// ── Customer Management ──────────────────────────────────────────────────

export const getCustomerDetail = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isManager(req.user.role)) throw new ApiError(403, 'Forbidden');
    const { id } = req.params;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        phones: { orderBy: { createdAt: 'desc' }, select: { phone: true, createdAt: true } },
        createdAt: true,
        isActive: true,
        orders: {
          where: {},  // no filter — ALL orders including CANCELLED
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            total: true,
            subtotal: true,
            shippingCost: true,
            tax: true,
            discountAmount: true,
            couponCode: true,
            shippingAddress: true,
            customerPhone: true,
            utrReference: true,
            cashfreePaymentId: true,
            cashfreeOrderId: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                productName: true,
                productImage: true,
                quantity: true,
                pricePerMeter: true,
                total: true,
                product: { select: { sku: true, code: true, color: true, basePrice: true } },
              },
            },
          },
        },
      },
    });

    if (!customer) throw new ApiError(404, 'Customer not found');

    res.json({ success: true, data: { ...customer, customerId: customerCode(customer.customerNumber) }, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

export const getCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Super admin sees everyone (customers, employees, admins) and can filter by role;
    // admins see customers only.
    const isSuper = req.user?.role === 'SUPER_ADMIN';
    const users = await prisma.user.findMany({
      where: isSuper ? {} : { role: 'CUSTOMER' },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          select: { total: true, createdAt: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCustomers = users
      .map((c) => ({
        id: c.id,
        customerId: customerCode(c.customerNumber),
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Guest User',
        email: c.email,
        phone: c.phone || 'N/A',
        role: effectiveRole(c),
        orders: c._count.orders,
        spent: c.orders.reduce((s, o) => s + (o.total || 0), 0),
        joined: c.createdAt,
        lastSeen: c.orders[0]?.createdAt || c.createdAt,
        // Orders and value split by status, so the admin can filter (e.g. only delivered)
        byStatus: c.orders.reduce((acc, o) => {
          const k = o.status as string;
          acc[k] = acc[k] || { count: 0, value: 0 };
          acc[k].count += 1;
          acc[k].value += o.total || 0;
          return acc;
        }, {} as Record<string, { count: number; value: number }>),
        status: c.isActive ? 'Active' : 'Inactive',
      }))
      // an admin never sees staff, even if a super-admin email is stored as CUSTOMER
      .filter((c) => isSuper || c.role === 'CUSTOMER');

    res.json({
      success: true,
      message: 'Customers retrieved',
      data: formattedCustomers,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
  }
};

/** GET /admin/me — the signed-in staff member's current role (re-read from the database) */
export const getMyRole = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: { role: req.user?.role }, statusCode: 200 } as ApiResponse);
};

/** PATCH /admin/users/:id/role — super admin only: set ADMIN, EMPLOYEE or CUSTOMER */
export const setUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = String(req.body?.role || '').toUpperCase();
    if (!ASSIGNABLE_ROLES.includes(role as any)) throw new ApiError(400, 'Role must be Admin, Employee or Customer');
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true } });
    if (!target) throw new ApiError(404, 'User not found');
    if (isSuperAdminEmail(target.email)) throw new ApiError(400, 'The super admin role cannot be changed');
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { role: role as any },
      select: { id: true, email: true, role: true },
    });
    res.json({ success: true, message: `Role updated to ${role.toLowerCase()}`, data: updated, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      console.error('[Admin] setUserRole failed:', error);
      res.status(500).json({ success: false, message: 'Could not update the role', statusCode: 500 } as ApiResponse);
    }
  }
};

// ── Banner Management ────────────────────────────────────────────────────

export const getBanners = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: banners, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
  }
};

export const createBanner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const banner = await prisma.banner.create({ data });
    res.status(201).json({ success: true, data: banner, statusCode: 201 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner', statusCode: 500 } as ApiResponse);
  }
};

export const updateBanner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.update({ where: { id }, data: req.body });
    res.json({ success: true, data: banner, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', statusCode: 500 } as ApiResponse);
  }
};

export const deleteBanner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true, message: 'Banner deleted', statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner', statusCode: 500 } as ApiResponse);
  }
};

/**
 * Syncs images of a single product from Google Drive to Supabase Storage
 */
export const syncProductImages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can sync product images');
    }

    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { colors: true, category: { select: { name: true } } },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const productForSync: ProductWithColors = {
      id: product.id,
      name: product.name,
      code: product.code,
      styleCode: product.styleCode,
      folderUrl: product.folderUrl,
      colors: product.colors.map((c: any) => ({
        id: c.id,
        name: c.name,
        productCode: c.productCode,
        folderUrl: c.folderUrl,
      })),
    };
    const imageCount = await syncImagesForProduct(productForSync, product.category.name);
    invalidateProductCaches();

    res.json({
      success: true,
      message: `Successfully synced ${imageCount} image(s) for product: ${product.name}`,
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error syncing images:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to sync product images.',
      statusCode: error.statusCode || 500,
    } as ApiResponse);
  }
};

/**
 * Syncs images for all products that have folderUrls
 */
export const syncAllProductImages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !isStaff(req.user.role)) {
      throw new ApiError(403, 'Only admins can sync all product images');
    }

    // Find all products
    const products = await prisma.product.findMany({
      include: { colors: true, category: { select: { name: true } } },
    });

    console.log(`[Sync All] Found ${products.length} products to sync.`);
    let syncCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const productForSync: ProductWithColors = {
          id: product.id,
          name: product.name,
          code: product.code,
          styleCode: product.styleCode,
          folderUrl: product.folderUrl,
          colors: product.colors.map((c: any) => ({
            id: c.id,
            name: c.name,
            productCode: c.productCode,
            folderUrl: c.folderUrl,
          })),
        };
        await syncImagesForProduct(productForSync, product.category.name);
        syncCount++;
      } catch (err: any) {
        console.error(`[Sync All] Failed syncing product "${product.name}":`, err.message);
        errors.push(`Product "${product.name}": ${err.message}`);
      }
    }

    invalidateProductCaches();

    res.json({
      success: true,
      message: `Successfully synced ${syncCount} of ${products.length} products.`,
      data: {
        totalProducts: products.length,
        syncedCount: syncCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error syncing all images:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to sync all product images.',
      statusCode: error.statusCode || 500,
    } as ApiResponse);
  }
};

/** Migrate all existing products to the new Code-Name-Category[-Color] naming format */
export const migrateProductCodes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        category: { select: { name: true } },
      },
    });

    let updated = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const categoryName = product.category?.name || 'Unknown';
        const colorName = product.color || 'Unknown';
        const code = product.code ?? '000';
        const newProductCode = buildProductCode(product.name, categoryName, colorName, code);
        const newStyleCode = buildStyleCode(product.name, categoryName, code);
        const newSlug = generateSlug(newProductCode);

        await prisma.product.update({
          where: { id: product.id },
          data: { productCode: newProductCode, styleCode: newStyleCode, slug: newSlug },
        });
        updated++;
      } catch (err: any) {
        errors.push(`"${product.name}" (${product.id}): ${err.message}`);
      }
    }

    invalidateProductCaches();

    res.json({
      success: true,
      message: `Migrated ${updated}/${products.length} products to new P{code}-Name-Category-Color format.`,
      data: { updated, total: products.length, errors: errors.length > 0 ? errors : undefined },
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, message: error.message, statusCode: 500 } as ApiResponse);
  }
};





// ── History (activity log) ───────────────────────────────────────────────
/** GET /admin/history?page=&limit=&entity=&q=&from=&to= — newest first */
export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const entity = String(req.query.entity || '');
    const q = String(req.query.q || '').trim();
    const where: any = {};
    if (entity && entity !== 'ALL') where.entity = entity;
    if (q) where.details = { contains: q, mode: 'insensitive' };
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if ((from && !isNaN(+from)) || (to && !isNaN(+to))) {
      where.createdAt = {};
      if (from && !isNaN(+from)) where.createdAt.gte = from;
      if (to && !isNaN(+to)) where.createdAt.lte = to;
    }
    const [rows, total] = await Promise.all([
      prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.activityLog.count({ where }),
    ]);
    const items = rows.map((r) => {
      let d: any = {};
      try { d = r.details ? JSON.parse(r.details) : {}; } catch { d = { summary: r.details }; }
      return {
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        summary: d.summary || r.action,
        actorName: d.actorName || null,
        actorEmail: d.actorEmail || null,
        actorRole: d.actorRole || null,
        createdAt: r.createdAt,
      };
    });
    res.json({ success: true, data: { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) }, statusCode: 200 } as ApiResponse);
  } catch (error) {
    console.error('[History] list failed:', error);
    res.status(500).json({ success: false, message: 'Could not load history', statusCode: 500 } as ApiResponse);
  }
};


// ── Product photos (admin) ───────────────────────────────────────────────
/** GET /admin/products/:id/photos — Raw original + the customer photos, in order */
export const getProductPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, color: true, slug: true,
        rawImage: { select: { url: true, updatedAt: true } },
        images: { orderBy: { order: 'asc' }, select: { id: true, url: true, isMain: true, order: true } },
      },
    });
    if (!product) throw new ApiError(404, 'Product not found');
    res.json({ success: true, data: product, statusCode: 200 } as ApiResponse);
  } catch (error) {
    const code = error instanceof ApiError ? error.statusCode : 500;
    res.status(code).json({ success: false, message: error instanceof ApiError ? error.message : 'Could not load photos', statusCode: code } as ApiResponse);
  }
};

/**
 * GET /admin/products/preview/:slug — the customer view of a product for staff,
 * even if it is switched off or has no photos yet. Same shape as the public
 * product endpoint; never includes the Raw photo.
 */
export const previewProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: { select: { name: true, slug: true } },
        reviews: {
          include: { user: { select: { firstName: true, lastName: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!product) throw new ApiError(404, 'Product not found');
    res.json({
      success: true,
      data: { ...product, previewOnly: !product.isActive || product.images.length === 0 },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    const code = error instanceof ApiError ? error.statusCode : 500;
    res.status(code).json({ success: false, message: error instanceof ApiError ? error.message : 'Could not load preview', statusCode: code } as ApiResponse);
  }
};


/**
 * Background job: fabrics that are live but still have no photos (e.g. the photos were
 * still being made in Drive when the fabric was added) get synced automatically.
 */
export const autoSyncMissingImages = async (): Promise<number> => {
  const products = await prisma.product.findMany({
    where: { isActive: true, images: { none: {} } },
    include: { colors: true, category: { select: { name: true } } },
    take: 10,
  });
  let synced = 0;
  for (const product of products) {
    try {
      const n = await syncImagesForProduct({
        id: product.id,
        name: product.name,
        code: product.code,
        styleCode: product.styleCode,
        folderUrl: product.folderUrl,
        colors: product.colors.map((c: any) => ({ id: c.id, name: c.name, productCode: c.productCode, folderUrl: c.folderUrl })),
      }, product.category.name);
      console.log(`[Auto-sync] ${product.productCode || product.name}: ${n} photos`);
      synced++;
    } catch (err: any) {
      console.warn(`[Auto-sync] ${product.productCode || product.name}: ${err.message || err}`);
    }
  }
  if (synced) invalidateProductCaches();
  return synced;
};

export const startMissingImageSync = (): void => {
  const run = () => { autoSyncMissingImages().catch((e) => console.error('[Auto-sync] failed:', e)); };
  setTimeout(run, 2 * 60 * 1000);
  setInterval(run, 30 * 60 * 1000).unref();
};

/** Email the order (with Print address / Print bill buttons) to our orders mailbox again */
export const emailOrderToTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = await resendTeamOrderEmail(req.params.id);
    if (!ok) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    res.json({ success: true, message: 'Order emailed to orders@rcsfabrics.com' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Could not send the email' });
  }
};
