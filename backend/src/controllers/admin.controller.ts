import { Response } from 'express';
import { prisma } from '@/index';
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

// Reusable function to convert a stream to a buffer
const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const uploadDriveFilesToSupabase = async (files: DriveFileDetails[]): Promise<string[]> => {
  const publicUrls: string[] = [];
  for (const file of files) {
    console.log(`[Supabase Upload] Downloading file: ${file.name} (${file.id})`);
    const streamRes = await getDriveImageStream(file.id);
    const buffer = await streamToBuffer(streamRes.data);
    const publicUrl = await uploadImageToSupabase(
      buffer,
      file.name,
      file.mimeType || 'image/jpeg'
    );
    publicUrls.push(publicUrl);
    console.log(`[Supabase Upload] Uploaded successfully: ${file.name} -> ${publicUrl}`);
  }
  return publicUrls;
};

/**
 * Downloads all images from a product-code-named Drive folder.
 * Image filenames inside the folder can be anything (e.g. Stretchable-1.png).
 */
const uploadAllImagesFromFolder = async (folderId: string): Promise<string[]> => {
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

const saveSyncedImages = async (productId: string, supabaseUrls: string[]) => {
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

  if (!product.folderUrl && isGenericProduct) {
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
    if (color.folderUrl) continue;

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
  const uploadedFileIds = new Set<string>();
  const syncedFolderIds = new Set<string>();

  const syncFolderOnce = async (folderId: string) => {
    if (syncedFolderIds.has(folderId)) return;
    syncedFolderIds.add(folderId);
    const urls = await uploadAllImagesFromFolder(folderId);
    supabaseUrls.push(...urls);
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
      const urls = await uploadDriveFilesToSupabase(newFiles);
      supabaseUrls.push(...urls);
    } catch (err: any) {
      console.error(`[Sync] Failed uploading files for code "${productCode}":`, err.message || err);
    }
  }

  const uniqueUrls = [...new Set(supabaseUrls)];

  if (uniqueUrls.length === 0) {
    const codesHint = productCodes.slice(0, 3).join(', ');
    throw new ApiError(
      400,
      `No images found for product code(s): ${codesHint}. Add the Google Drive folder link on the product (folder name should match the product code), put images inside, and share the folder with the service account.`
    );
  }

  await saveSyncedImages(product.id, uniqueUrls);
  return uniqueUrls.length;
};

export const createProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
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
    if (!req.user || req.user.role !== 'ADMIN') {
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
        finalImageUrls = await uploadAllImagesFromFolder(folderId);
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
    if (!req.user || req.user.role !== 'ADMIN') {
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
    if (!req.user || req.user.role !== 'ADMIN') {
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
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can access this');
    }

    const { page, limit, status } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string
    );

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              pricePerMeter: true,
              total: true,
              productName: true,
              productImage: true,
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
        orders,
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

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can update orders');
    }

    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        paymentStatus,
      },
      include: {
        items: true,
      },
    });

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
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can access this');
    }

    const [totalOrders, totalRevenue, totalCustomers, totalProducts] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
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
      expiresAt,
    } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      throw new ApiError(400, 'Code, type, value, and expiry are required');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxUses,
        startsAt: new Date(),
        expiresAt: new Date(expiresAt),
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
    if (!req.user || req.user.role !== 'ADMIN') {
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

export const getCustomers = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          select: { total: true },
          take: 100, // Limit to prevent fetching too much data
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Guest User',
      email: c.email,
      phone: c.phone || 'N/A',
      orders: c._count.orders,
      spent: c.orders.reduce((s, o) => s + (o.total || 0), 0),
      joined: c.createdAt,
      status: c.isActive ? 'Active' : 'Inactive',
    }));

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
    if (!req.user || req.user.role !== 'ADMIN') {
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
    if (!req.user || req.user.role !== 'ADMIN') {
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



